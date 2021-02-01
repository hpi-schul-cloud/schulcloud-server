/* eslint-disable no-console */
const args = require('args');
const CryptoJS = require('crypto-js');

args.option('key', 'The key to encrypt the password').option('token', 'Not encrypted token');

const options = args.parse(process.argv);

const encrypted = CryptoJS.AES.encrypt(options.key, options.token).toString();

console.log(encrypted);
