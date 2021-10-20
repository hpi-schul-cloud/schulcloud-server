import { SymetricKeyEncryptionService } from './encryption.service';

describe('SymetricKeyEncryptionService', () => {
	const encryptionKey = 'abcdefghijklmnop';
	const encryptionService = new SymetricKeyEncryptionService(encryptionKey);
	const testInput = 'testInput';

	it('encrypts the input', () => {
		expect(encryptionService.encrypt(testInput)).not.toEqual(testInput);
	});

	it('should decrypt prior encrypted values', () => {
		// If the test fails because the encryption algorithm has been changed,
		// do not forget to migrate encrypted values from the database accordingly!
		const encryptedValue = encryptionService.encrypt(testInput);
		expect(encryptedValue.length).toEqual(44);
		expect(encryptedValue).not.toEqual(testInput);
		const decryptionResult = encryptionService.decrypt(encryptedValue);
		// Due to different IV and salt values, the encrypted values cannot be compared directly
		expect(decryptionResult).toEqual(testInput);
	});
});
