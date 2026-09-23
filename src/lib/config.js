'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.alto-rootstock');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULTS = {
  // Auth proxy in front of the private alto-rootstock-skills repo. Gates access
  // behind Google Sign-In restricted to @altoconsultants.ca. See proxy/README.md.
  proxyUrl: 'https://alto-rootstock-auth.alto-rootstock-auth.workers.dev',
  token: null,
  email: null,
};

function load() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    }
  } catch (_) {}
  return { ...DEFAULTS };
}

function save(partial) {
  const current = load();
  const next = { ...current, ...partial };
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

module.exports = { load, save, CONFIG_FILE };
