import { SymetricKeyEncryptionService } from './encryption.service';

describe('SymetricKeyEncryptionService', () => {
	const encryptionService = new SymetricKeyEncryptionService('abcdefghijklmnop');
	const testInput = 'testInput';

	it('encrypts the input', () => {
		expect(encryptionService.encrypt(testInput)).not.toEqual(testInput);
	});

	it('decrypts the encrypted input', () => {
		const encryptedValue = encryptionService.encrypt(testInput);
		expect(encryptionService.decrypt(encryptedValue)).toEqual(testInput);
	});
});
