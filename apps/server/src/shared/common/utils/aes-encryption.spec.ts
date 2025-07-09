import CryptoJS from 'crypto-js';
import { decryptAES, encryptAES } from './aes-encryption';

// The tests are copied from https://github.com/RaisinTen/aes-crypto-js/blob/v0.1.0/test.js.

describe('aes-encryption', () => {
	describe('crypto-js compatibility when using simple strings', () => {
		const plainText = 'Hello, world!';
		const secret = 'umm, shhh ...';

		it('encrypted using crypto-js and decrypted using our functions', () => {
			const encrypted = CryptoJS.AES.encrypt(plainText, secret).toString();
			const decrypted = decryptAES(encrypted, secret);

			expect(decrypted).toEqual(plainText);
		});

		it('encrypted using our functions and decrypted using crypto-js', () => {
			const encrypted = encryptAES(plainText, secret);
			const decrypted = CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);

			expect(decrypted).toEqual(plainText);
		});
	});

	describe('crypto-js compatibility when using weird characters in secret', () => {
		const plainText = 'Hello, world!';
		const secret = 'umm, šhhh ... 😀D◌̇랆탆𝐿 𑒹◌̴◌𑒺';

		it('encrypted using crypto-js and decrypted using our functions', () => {
			const encrypted = CryptoJS.AES.encrypt(plainText, secret).toString();
			const decrypted = decryptAES(encrypted, secret);

			expect(decrypted).toEqual(plainText);
		});

		it('encrypted using our functions and decrypted using crypto-js', () => {
			const encrypted = encryptAES(plainText, secret);
			const decrypted = CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);

			expect(decrypted).toEqual(plainText);
		});
	});

	describe('crypto-js compatibility when using bytes corresponding to a single character that are split between two buffers', () => {
		const plainText = '\u{30a8}\u{30b9}\u{30af}\u{30fc}\u{30c8}\u{3099}';
		const secret = 'umm, shhh ...';

		it('encrypted using crypto-js and decrypted using our functions', () => {
			const encrypted = CryptoJS.AES.encrypt(plainText, secret).toString();
			const decrypted = decryptAES(encrypted, secret);

			expect(decrypted).toEqual(plainText);
		});

		it('encrypted using our functions and decrypted using crypto-js', () => {
			const encrypted = encryptAES(plainText, secret);
			const decrypted = CryptoJS.AES.decrypt(encrypted, secret).toString(CryptoJS.enc.Utf8);

			expect(decrypted).toEqual(plainText);
		});
	});
});
