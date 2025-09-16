const { decryptAes, encryptAes } = require('../src/utils/aes-encryption');
const args = require('args');

args
	.option('secret', 'the secret environment variable')
	.option('encrypt', 'the payload (to encrypt)')
	.option('decrypt', 'the encrypted payload (to decrypt)');

const options = args.parse(process.argv);

if (!options.secret || !(options.encrypt || options.decrypt)) {
	args.showHelp();
	process.exit(0);
}

if (options.encrypt) {
	console.log(encryptAes(options.e, options.s));
} else {
	console.log(decryptAes(options.d, options.s));
}
