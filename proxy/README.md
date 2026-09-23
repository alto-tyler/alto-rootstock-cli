# alto-rootstock-cli auth proxy

Sits in front of the private `alto-tyler/alto-rootstock-skills` repo. Gates every
file read behind Google Sign-In restricted to `@altoconsultants.ca`. Nobody on
the team ever handles a GitHub token — the only person who touches GitHub
credentials is whoever deploys this.

## One-time setup

### 1. Google OAuth client

1. https://console.cloud.google.com/ → create (or reuse) a project.
2. **APIs & Services → OAuth consent screen** — User type "Internal" if this
   Google Cloud project lives inside the altoconsultants.ca Workspace (this
   alone restricts sign-in to your domain, before any server-side check even
   runs). If it must be "External", keep the server-side `hd` check in
   `worker.js` as the real gate.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**,
   type "Web application".
4. Authorized redirect URI: `https://<your-worker-subdomain>.workers.dev/oauth/callback`
   (you'll know the exact subdomain after step 2 below — you can come back and
   add it).
5. Save the **Client ID** and **Client secret**.

### 2. Cloudflare Worker

```
cd proxy
npm install -g wrangler   # if you don't have it
wrangler login
wrangler deploy
```

This prints the worker's URL, e.g. `https://alto-rootstock-auth.<your-subdomain>.workers.dev`.
Go back to step 1.4 and add `<that-url>/oauth/callback` as an authorized
redirect URI.

### 3. GitHub PAT (read-only, scoped to one repo)

1. https://github.com/settings/personal-access-tokens/new
2. Resource owner: `alto-tyler`. Repository access: **Only select repositories**
   → `alto-rootstock-skills`.
3. Permissions: **Contents: Read-only**. Nothing else.
4. Generate, copy the token.

### 4. Set secrets

```
cd proxy
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_TOKEN
wrangler secret put SESSION_SECRET   # any long random string, e.g. `openssl rand -hex 32`
```

### 5. Point the CLI at the deployed worker

Update the `proxyUrl` default in [`src/lib/config.js`](../src/lib/config.js) to
the real worker URL from step 2, then bump the package version and publish.

## Testing

```
altors login       # opens browser, Google sign-in, redirects back to localhost
altors whoami       # should show your @altoconsultants.ca email
altors new           # (or update/install) — should fetch skill files through the proxy
altors logout
```

Try signing in with a non-altoconsultants.ca Google account — it should be
rejected with a 403 both from the consent screen (if consent screen is
"Internal") and from the worker's own `hd` check.

## Rotating access

- **Revoke everyone:** `wrangler secret put SESSION_SECRET` with a new value —
  every existing session JWT is invalidated instantly (old signatures no
  longer verify). Everyone just runs `altors login` again.
- **Add/remove a teammate:** nothing to do — access is their
  @altoconsultants.ca Google account, not a per-person credential.
- **Rotate the GitHub PAT:** generate a new one, `wrangler secret put GITHUB_TOKEN`,
  revoke the old one on GitHub.
