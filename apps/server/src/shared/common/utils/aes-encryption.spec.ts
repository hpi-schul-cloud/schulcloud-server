import { AesEncryptionHelper } from './aes-encryption';

describe('AesEncryptionHelper', () => {
	it('should encrypt and decrypt a string', () => {
		const plainText = 'foo';
		const secret = 'bar';

		const encrypted = AesEncryptionHelper.encrypt(plainText, secret);
		const decrypted = AesEncryptionHelper.decrypt(encrypted, secret);

		expect(decrypted).toBe(plainText);
	});
});
