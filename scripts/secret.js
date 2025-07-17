const { decryptAES, encryptAES } = require('../src/utils/aes-encryption');
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
	console.log(encryptAES(options.e, options.s));
} else {
	console.log(decryptAES(options.d, options.s));
}
