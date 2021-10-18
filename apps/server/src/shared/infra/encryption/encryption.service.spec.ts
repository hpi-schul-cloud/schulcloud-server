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
		const aesEncryption = CryptoJs.AES.encrypt(testInput, encryptionKey).toString();
		expect(encryptionService.encrypt(testInput)).toEqual(aesEncryption);
	});

	it('decrypts the encrypted input', () => {
		const encryptedValue = encryptionService.encrypt(testInput);
		expect(encryptionService.decrypt(encryptedValue)).toEqual(testInput);
	});
});
