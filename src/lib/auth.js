'use strict';

const http = require('http');
const { execFile } = require('child_process');
const chalk = require('chalk');
const { load, save } = require('./config');

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

function openBrowser(url) {
  const platform = process.platform;
  if (platform === 'win32') {
    // cmd's `start` needs an empty title arg when the URL is quoted
    execFile('cmd', ['/c', 'start', '""', url], () => {});
  } else if (platform === 'darwin') {
    execFile('open', [url], () => {});
  } else {
    execFile('xdg-open', [url], () => {});
  }
}

function login() {
  const { proxyUrl } = load();

  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      server.close();
      reject(new Error('Login timed out. Run `altors login` again.'));
    }, LOGIN_TIMEOUT_MS);

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }

      const token = url.searchParams.get('token');
      const email = url.searchParams.get('email');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        token
          ? '<html><body style="font-family:system-ui;background:#111;color:#eee;display:flex;height:100vh;align-items:center;justify-content:center"><p>Signed in. You can close this tab.</p></body></html>'
          : '<html><body style="font-family:system-ui;background:#111;color:#eee;display:flex;height:100vh;align-items:center;justify-content:center"><p>Login failed. Return to your terminal.</p></body></html>'
      );

      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();

      if (!token) {
        reject(new Error('Login did not complete — no session token received.'));
        return;
      }

      save({ token, email });
      resolve({ email });
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      const loginUrl = `${proxyUrl}/login?port=${port}`;
      openBrowser(loginUrl);
      console.log(`If your browser didn't open automatically, visit:\n  ${loginUrl}\n`);
    });

    server.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

function logout() {
  save({ token: null, email: null });
}

function whoami() {
  const { email, token } = load();
  return token ? email : null;
}

// Called at the start of any command that needs to fetch content. Prompts
// an interactive sign-in automatically on first use instead of failing with
// an error that tells the user to run a separate command themselves.
async function ensureLoggedIn() {
  if (whoami()) return;
  console.log();
  console.log(chalk.yellow('  Not signed in — opening your browser to sign in with your @altoconsultants.ca Google account...'));
  console.log();
  const { email } = await login();
  console.log(chalk.green(`  ✓ Signed in as ${email}`));
}

module.exports = { login, logout, whoami, ensureLoggedIn };
