'use strict';

const chalk = require('chalk');
const { whoami } = require('../lib/auth');

async function run() {
  const email = whoami();
  console.log();
  if (email) {
    console.log(chalk.green(`  Signed in as ${email}`));
  } else {
    console.log(chalk.yellow('  Not signed in. Run `altors login`.'));
  }
  console.log();
}

module.exports = { run };
