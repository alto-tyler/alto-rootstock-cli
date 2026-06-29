'use strict';

const https = require('https');
const { load, getToken } = require('./config');

function fetchUrl(url, token) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const headers = { 'User-Agent': 'alto-rootstock-cli' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    https.get({ hostname: opts.hostname, path: opts.pathname + opts.search, headers }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return fetchUrl(res.headers.location, token).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function fetchRemoteFile(remotePath) {
  const { baseUrl } = load();
  const token = getToken();
  const url = `${baseUrl}/${remotePath}`;
  return fetchUrl(url, token);
}

async function fetchRemoteJson(remotePath) {
  const text = await fetchRemoteFile(remotePath);
  return JSON.parse(text);
}

module.exports = { fetchRemoteFile, fetchRemoteJson, fetchUrl };
