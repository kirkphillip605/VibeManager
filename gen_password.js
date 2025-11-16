#!/usr/bin/env node

/**
 * @file generate-password-hash.js
 * @description Terminal utility that prompts the user for a password,
 *              confirms it, hashes it using bcrypt, and prints the hash.
 *              Intended for manual user creation in a PostgreSQL database.
 *
 * @requires bcrypt
 * @requires readline/promises
 */

import bcrypt from 'bcrypt';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * @function promptPassword
 * @description Prompts the user twice for the same password and validates the match.
 * @returns {Promise<string>} The confirmed password.
 * @throws {Error} If the passwords do not match.
 */
async function promptPassword() {
  const rl = createInterface({ input, output });

  const pwd = await rl.question('Enter password: ', { hideEchoBack: true });
  const confirm = await rl.question('Confirm password: ', { hideEchoBack: true });

  rl.close();

  if (pwd !== confirm) {
    throw new Error('❌ Passwords do not match. Try again.');
  }

  return pwd;
}

/**
 * @function hashPassword
 * @description Hashes a given password using bcrypt.
 * @param {string} password - The plain text password.
 * @returns {Promise<string>} The hashed password.
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * @function main
 * @description Orchestrates prompting, hashing, and printing the password hash.
 */
async function main() {
  try {
    const password = await promptPassword();
    const hash = await hashPassword(password);

    console.log('\n🔐 Password hash generated successfully:\n');
    console.log(hash);
    console.log('\nUse this hash when manually inserting a user into the database.\n');
  } catch (err) {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  }
}

await main();
