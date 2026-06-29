'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.alto-rootstock');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULTS = {
  baseUrl: 'https://raw.githubusercontent.com/alto-tyler/rootstock-agent-distribution/main',
};

function load() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    }
  } catch (_) {}
  return { ...DEFAULTS };
}

function save(data) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getToken() {
  return process.env.GITHUB_TOKEN || load().token || null;
}

function saveToken(token) {
  save({ ...load(), token });
}

module.exports = { load, save, getToken, saveToken, CONFIG_FILE };
