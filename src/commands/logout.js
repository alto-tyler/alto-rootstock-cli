'use strict';

const chalk = require('chalk');
const { logout } = require('../lib/auth');

async function run() {
  logout();
  console.log();
  console.log(chalk.green('  ✓ Signed out'));
  console.log();
}

module.exports = { run };
