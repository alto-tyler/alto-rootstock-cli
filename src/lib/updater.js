'use strict';

const { fetchRemoteJson } = require('./fetcher');

function parseVersion(v) {
  return (v || '0.0.0').replace(/^v/, '').split('.').map(Number);
}

function isNewer(latest, current) {
  const l = parseVersion(latest);
  const c = parseVersion(current);
  for (let i = 0; i < 3; i++) {
    if (l[i] > c[i]) return true;
    if (l[i] < c[i]) return false;
  }
  return false;
}

async function checkForUpdate(currentVersion) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const data = await Promise.race([
      fetchRemoteJson('version.json'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2500)
      ),
    ]);

    clearTimeout(timeout);

    const latest = data.cliVersion || data.version;
    if (latest && isNewer(latest, currentVersion)) {
      return { current: currentVersion, latest };
    }
  } catch (_) {
    // Network unavailable or timeout — silently skip
  }
  return null;
}

module.exports = { checkForUpdate, isNewer };
