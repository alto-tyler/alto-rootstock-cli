#!/usr/bin/env node
'use strict';

// Best-effort fix for the classic npm issue where a freshly installed
// global bin (e.g. `altors`) isn't recognized because npm's global bin
// folder was never added to PATH. Never fails the install.

const path = require('path');
const { execFileSync } = require('child_process');

function isGlobalInstall() {
  return process.env.npm_config_global === 'true';
}

function getNpmPrefix() {
  return execFileSync('npm', ['config', 'get', 'prefix'], {
    encoding: 'utf8',
    shell: true,
  }).trim();
}

function isOnPath(dir, pathValue, sep) {
  const normalize = (p) => p.trim().replace(/[\\/]+$/, '').toLowerCase();
  const target = normalize(dir);
  return pathValue
    .split(sep)
    .some((entry) => entry && normalize(entry) === target);
}

function addToUserPath(dir) {
  // Read/modify/write the *User* PATH env var via PowerShell so this
  // never needs admin rights, then broadcast the change so new shells
  // pick it up without a reboot.
  const script = `
$dir = [Environment]::GetEnvironmentVariable('Path','User')
if (-not $dir) { $dir = '' }
$parts = $dir.Split(';') | Where-Object { $_ -ne '' }
$target = '${dir.replace(/'/g, "''")}'
$already = $parts | Where-Object { $_.TrimEnd('\\\\') -ieq $target.TrimEnd('\\\\') }
if (-not $already) {
  $newPath = if ($dir -and -not $dir.EndsWith(';')) { "$dir;$target" } else { "$dir$target" }
  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
}
`.trim();

  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
    { stdio: 'ignore' }
  );
}

function rcFileForShell() {
  const shell = process.env.SHELL || '';
  const home = require('os').homedir();
  if (shell.includes('zsh')) return path.join(home, '.zshrc');
  if (shell.includes('bash')) return path.join(home, '.bash_profile');
  if (shell.includes('fish')) return path.join(home, '.config/fish/config.fish');
  return path.join(home, '.profile');
}

function exportLine(shell, binDir) {
  if (shell.includes('fish')) return `set -gx PATH "${binDir}" $PATH`;
  return `export PATH="${binDir}:$PATH"`;
}

function runWindows() {
  let prefix;
  try {
    prefix = getNpmPrefix();
  } catch {
    return;
  }
  if (!prefix) return;

  const currentPath = process.env.PATH || process.env.Path || '';
  if (isOnPath(prefix, currentPath, ';')) return;

  try {
    addToUserPath(prefix);
    console.log('');
    console.log(`  altors: added "${prefix}" to your PATH.`);
    console.log('  Restart your terminal for the `altors` command to work.');
    console.log('');
  } catch {
    console.log('');
    console.log(`  altors: could not update PATH automatically.`);
    console.log(`  Add this folder to your PATH manually: ${prefix}`);
    console.log('');
  }
}

function runUnix() {
  let prefix;
  try {
    prefix = getNpmPrefix();
  } catch {
    return;
  }
  if (!prefix) return;

  // On macOS/Linux npm's global bin lives in <prefix>/bin, not <prefix> itself.
  const binDir = path.join(prefix, 'bin');
  const currentPath = process.env.PATH || '';
  if (isOnPath(binDir, currentPath, ':')) return;

  // Don't silently rewrite shell rc files — too many possible shells/configs
  // to do safely. Print the exact fix instead.
  const shell = process.env.SHELL || '';
  const rcFile = rcFileForShell();
  const line = exportLine(shell, binDir);

  console.log('');
  console.log(`  altors: "${binDir}" is not on your PATH, so \`altors\` won't be found.`);
  console.log(`  Add this line to ${rcFile}, then restart your terminal:`);
  console.log('');
  console.log(`    ${line}`);
  console.log('');
}

function main() {
  if (!isGlobalInstall()) return;
  if (process.env.CI) return;

  if (process.platform === 'win32') runWindows();
  else if (process.platform === 'darwin' || process.platform === 'linux') runUnix();
}

try {
  main();
} catch {}
