const crypto = require('crypto-js');
const args = require('args');

args
	.option('secret', 'the secret environment variable')
	.option('encrypt', 'the payload (to encrypt)')
	.option('decrypt', 'the encrypted payload (to decrypt)')

const options = args.parse(process.argv);

if (!options.secret || !(options.encrypt || options.decrypt)) {
	args.showHelp();
	process.exit(0);
}

if (options.encrypt) {
	console.log(crypto.AES.encrypt(options.e, options.s).toString())
} else {
	console.log(crypto.AES.decrypt(options.d, options.s).toString(crypto.enc.Utf8))
}
