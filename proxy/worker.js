'use strict';

/**
 * alto-rootstock-cli auth proxy.
 *
 * Gates read access to the private alto-tyler/alto-rootstock-skills repo behind
 * Google Sign-In restricted to the altoconsultants.ca Workspace domain. The CLI
 * never sees the GitHub token — it only ever holds a short-lived session JWT
 * signed by this worker.
 *
 * Routes:
 *   GET /login?port=<n>            -> redirects to Google's OAuth consent screen
 *   GET /oauth/callback?code&state -> verifies the Google ID token, mints a
 *                                     session JWT, hands it to the CLI's local
 *                                     callback server
 *   GET /content/<path>            -> Authorization: Bearer <jwt> required;
 *                                     proxies the file from the private GitHub
 *                                     repo using the worker's own PAT
 *
 * Required secrets (wrangler secret put <name>):
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GITHUB_TOKEN        - fine-grained PAT, read-only, scoped to the skills repo
 *   SESSION_SECRET       - random string used to HMAC-sign session JWTs & OAuth state
 *
 * Config (wrangler.toml [vars]):
 *   ALLOWED_DOMAIN   default "altoconsultants.ca"
 *   GITHUB_REPO      default "alto-tyler/alto-rootstock-skills"
 *   GITHUB_REF       default "main"
 */

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/login') return handleLogin(url, env);
      if (url.pathname === '/oauth/callback') return handleCallback(url, env);
      if (url.pathname.startsWith('/content/')) return handleContent(request, url, env);
      if (url.pathname === '/health') return new Response('ok');
      return new Response('Not found', { status: 404 });
    } catch (err) {
      return new Response(`Internal error: ${err.message}`, { status: 500 });
    }
  },
};

// ---------------------------------------------------------------------------
// /login
// ---------------------------------------------------------------------------

async function handleLogin(url, env) {
  const port = url.searchParams.get('port');
  if (!port || !/^\d+$/.test(port)) {
    return new Response('Missing or invalid ?port=', { status: 400 });
  }

  const nonce = crypto.randomUUID();
  const state = await signState({ port, nonce }, env.SESSION_SECRET);

  const redirectUri = `${url.origin}/oauth/callback`;
  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('hd', env.ALLOWED_DOMAIN || 'altoconsultants.ca');
  authorizeUrl.searchParams.set('prompt', 'select_account');

  return Response.redirect(authorizeUrl.toString(), 302);
}

// ---------------------------------------------------------------------------
// /oauth/callback
// ---------------------------------------------------------------------------

async function handleCallback(url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return htmlError('Missing code or state from Google.');

  let statePayload;
  try {
    statePayload = await verifyState(state, env.SESSION_SECRET);
  } catch {
    return htmlError('Login request could not be verified (bad or expired state). Please try `altors login` again.');
  }

  const redirectUri = `${url.origin}/oauth/callback`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return htmlError(`Google token exchange failed: HTTP ${tokenRes.status}`);
  }
  const tokenBody = await tokenRes.json();

  let claims;
  try {
    claims = await verifyGoogleIdToken(tokenBody.id_token, env.GOOGLE_CLIENT_ID);
  } catch (err) {
    return htmlError(`Could not verify Google sign-in: ${err.message}`);
  }

  const allowedDomain = (env.ALLOWED_DOMAIN || 'altoconsultants.ca').toLowerCase();
  const emailDomain = String(claims.email || '').split('@')[1]?.toLowerCase();
  if (!claims.email_verified || emailDomain !== allowedDomain) {
    return htmlError(`Access is restricted to @${allowedDomain} accounts. Signed in as ${claims.email || 'unknown'}.`, 403);
  }

  const session = await signSession({ email: claims.email }, env.SESSION_SECRET);

  const callbackUrl = new URL(`http://127.0.0.1:${statePayload.port}/callback`);
  callbackUrl.searchParams.set('token', session);
  callbackUrl.searchParams.set('email', claims.email);

  return new Response(successPage(claims.email, callbackUrl.toString()), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ---------------------------------------------------------------------------
// /content/*
// ---------------------------------------------------------------------------

async function handleContent(request, url, env) {
  const auth = request.headers.get('Authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return new Response('Missing bearer token. Run `altors login`.', { status: 401 });

  let session;
  try {
    session = await verifySession(match[1], env.SESSION_SECRET);
  } catch {
    return new Response('Session expired or invalid. Run `altors login` again.', { status: 401 });
  }

  const allowedDomain = (env.ALLOWED_DOMAIN || 'altoconsultants.ca').toLowerCase();
  const emailDomain = String(session.email || '').split('@')[1]?.toLowerCase();
  if (emailDomain !== allowedDomain) {
    return new Response('Forbidden', { status: 403 });
  }

  const filePath = decodeURIComponent(url.pathname.replace(/^\/content\//, ''));
  if (!filePath || filePath.includes('..')) {
    return new Response('Invalid path', { status: 400 });
  }

  const repo = env.GITHUB_REPO || 'alto-tyler/alto-rootstock-skills';
  const ref = env.GITHUB_REF || 'main';
  const ghUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(ref)}`;

  const ghRes = await fetch(ghUrl, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.raw',
      'User-Agent': 'alto-rootstock-auth-proxy',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!ghRes.ok) {
    return new Response(`Upstream fetch failed: HTTP ${ghRes.status} for ${filePath}`, { status: ghRes.status === 404 ? 404 : 502 });
  }

  const body = await ghRes.text();
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// ---------------------------------------------------------------------------
// Session / state JWT helpers (HS256, stateless — no KV storage needed)
// ---------------------------------------------------------------------------

async function signState(payload, secret) {
  return signJwt({ ...payload, exp: nowSeconds() + 600 }, secret); // 10 min to complete login
}

async function verifyState(token, secret) {
  return verifyJwt(token, secret);
}

async function signSession(payload, secret) {
  return signJwt({ ...payload, exp: nowSeconds() + SESSION_TTL_SECONDS }, secret);
}

async function verifySession(token, secret) {
  return verifyJwt(token, secret);
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function b64url(bytes) {
  let str = typeof bytes === 'string' ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecodeToString(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = b64url(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const signingInput = `${encHeader}.${encPayload}`;
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${b64url(sig)}`;
}

async function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [encHeader, encPayload, encSig] = parts;
  const key = await hmacKey(secret);
  const sigBytes = Uint8Array.from(b64urlDecodeToString(encSig), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(`${encHeader}.${encPayload}`));
  if (!valid) throw new Error('Bad signature');
  const payload = JSON.parse(b64urlDecodeToString(encPayload));
  if (!payload.exp || nowSeconds() > payload.exp) throw new Error('Expired');
  return payload;
}

// ---------------------------------------------------------------------------
// Google ID token verification (RS256, via Google's published JWKS)
// ---------------------------------------------------------------------------

let jwksCache = null;
let jwksCacheAt = 0;

async function getGoogleJwks() {
  if (jwksCache && Date.now() - jwksCacheAt < 60 * 60 * 1000) return jwksCache;
  const res = await fetch(GOOGLE_JWKS_URL);
  if (!res.ok) throw new Error('Could not fetch Google JWKS');
  jwksCache = await res.json();
  jwksCacheAt = Date.now();
  return jwksCache;
}

async function verifyGoogleIdToken(idToken, expectedAudience) {
  if (!idToken) throw new Error('No id_token returned by Google');
  const [encHeader, encPayload, encSig] = idToken.split('.');
  if (!encHeader || !encPayload || !encSig) throw new Error('Malformed id_token');

  const header = JSON.parse(b64urlDecodeToString(encHeader));
  const payload = JSON.parse(b64urlDecodeToString(encPayload));

  const jwks = await getGoogleJwks();
  const jwk = jwks.keys.find(k => k.kid === header.kid);
  if (!jwk) throw new Error('Signing key not found in Google JWKS');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBytes = Uint8Array.from(b64urlDecodeToString(encSig), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    sigBytes,
    new TextEncoder().encode(`${encHeader}.${encPayload}`)
  );
  if (!valid) throw new Error('Bad Google id_token signature');

  if (!GOOGLE_ISSUERS.includes(payload.iss)) throw new Error('Unexpected issuer');
  if (payload.aud !== expectedAudience) throw new Error('Unexpected audience');
  if (!payload.exp || nowSeconds() > payload.exp) throw new Error('id_token expired');

  return payload;
}

// ---------------------------------------------------------------------------
// Tiny HTML responses
// ---------------------------------------------------------------------------

function successPage(email, redirectTo) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>alto-rootstock login</title>
<meta http-equiv="refresh" content="0;url=${redirectTo}">
<style>body{font-family:system-ui,sans-serif;background:#111;color:#eee;display:flex;height:100vh;align-items:center;justify-content:center}</style>
</head><body><p>Signed in as ${email}. You can close this tab and return to your terminal.</p>
<script>window.location.href=${JSON.stringify(redirectTo)};</script>
</body></html>`;
}

function htmlError(message, status = 400) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>alto-rootstock login</title>
<style>body{font-family:system-ui,sans-serif;background:#111;color:#eee;display:flex;height:100vh;align-items:center;justify-content:center;text-align:center;padding:2rem}</style>
</head><body><p>${message}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
