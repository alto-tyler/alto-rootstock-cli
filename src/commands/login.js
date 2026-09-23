'use strict';

const chalk = require('chalk');
const { login } = require('../lib/auth');

async function run() {
  console.log();
  console.log(chalk.bold('  Sign in with your @altoconsultants.ca Google account'));
  console.log(chalk.dim('  Opening your browser...'));
  console.log();

  try {
    const { email } = await login();
    console.log(chalk.green(`  ✓ Signed in as ${email}`));
    console.log();
  } catch (err) {
    console.log(chalk.red(`  ✗ ${err.message}`));
    console.log();
    process.exitCode = 1;
  }
}

module.exports = { run };
