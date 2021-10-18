import * as CryptoJs from 'crypto-js';

import { SymetricKeyEncryptionService } from './encryption.service';

describe('SymetricKeyEncryptionService', () => {
	const encryptionKey = 'abcdefghijklmnop';
	const encryptionService = new SymetricKeyEncryptionService(encryptionKey);
	const testInput = 'testInput';

	it('encrypts the input', () => {
		expect(encryptionService.encrypt(testInput)).not.toEqual(testInput);
	});

	it('encrypts the input with AES', () => {
		// If the test fails because the encryption algorithm has been changed, do not forget to migrate encrypted values from the database accordingly.
		const encryptedValue = encryptionService.encrypt(testInput);
		const aesDecryptionResult = CryptoJs.AES.decrypt(encryptedValue, encryptionKey).toString(CryptoJs.enc.Utf8);
		// Due to different IV and salt values, the encrypted values cannot be compared directly
		expect(aesDecryptionResult).toEqual(testInput);
	});

	it('decrypts the encrypted input', () => {
		const encryptedValue = encryptionService.encrypt(testInput);
		expect(encryptionService.decrypt(encryptedValue)).toEqual(testInput);
	});
});
