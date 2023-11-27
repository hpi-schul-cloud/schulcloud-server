import { createMock } from '@golevelup/ts-jest';
import { LegacyLogger } from '@src/core/logger';
import { SymetricKeyEncryptionService } from './encryption.service';

describe('SymetricKeyEncryptionService', () => {
	describe('with configure encryption key', () => {
		const encryptionKey = 'abcdefghijklmnop';
		const logger = createMock<LegacyLogger>();
		const encryptionService = new SymetricKeyEncryptionService(logger, encryptionKey);
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

		it('should not log warnings', () => {
			const encryptedValue = encryptionService.encrypt(testInput);
			encryptionService.decrypt(encryptedValue);
			expect(logger.warn).not.toHaveBeenCalled();
		});
	});

	describe('without configured encryption key', () => {
		const logger = createMock<LegacyLogger>();
		const encryptionService = new SymetricKeyEncryptionService(logger);
		const testInput = 'testInput';

		beforeEach(() => {
			logger.warn.mockClear();
		});

		it('logs warning during encryption if no encryption key is configured', () => {
			expect(encryptionService.encrypt(testInput)).toEqual(testInput);
			expect(logger.warn).toHaveBeenCalledTimes(1);
		});

		it('logs warning during decryption if no encryption key is configured', () => {
			expect(encryptionService.decrypt(testInput)).toEqual(testInput);
			expect(logger.warn).toHaveBeenCalledTimes(1);
		});
	});
});
