'use strict';

const https = require('https');
const { load } = require('./config');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const headers = { 'User-Agent': 'alto-rootstock-cli' };

    https.get({ hostname: opts.hostname, path: opts.pathname + opts.search, headers }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
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

function fetchUrlAuthed(url, token) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url);
    const headers = { 'User-Agent': 'alto-rootstock-cli', Authorization: `Bearer ${token}` };

    https.get({ hostname: opts.hostname, path: opts.pathname + opts.search, headers }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return fetchUrlAuthed(res.headers.location, token).then(resolve).catch(reject);
      }
      if (res.statusCode === 401) {
        res.resume();
        return reject(new Error('Not signed in (or session expired). Run `altors login`.'));
      }
      if (res.statusCode === 403) {
        res.resume();
        return reject(new Error('Access denied. Your account is not authorized for this content.'));
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
  const { proxyUrl, token } = load();
  if (!token) {
    throw new Error('Not signed in. Run `altors login` with your @altoconsultants.ca Google account first.');
  }
  return fetchUrlAuthed(`${proxyUrl}/content/${remotePath}`, token);
}

async function fetchRemoteJson(remotePath) {
  const text = await fetchRemoteFile(remotePath);
  return JSON.parse(text);
}

module.exports = { fetchRemoteFile, fetchRemoteJson, fetchUrl };
