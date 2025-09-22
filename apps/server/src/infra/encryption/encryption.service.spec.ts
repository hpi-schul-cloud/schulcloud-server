import { createMock } from '@golevelup/ts-jest';
import { LegacyLogger } from '@core/logger';
import { SymmetricKeyEncryptionService } from './encryption.service';

describe('SymmetricKeyEncryptionService', () => {
	describe('with configure encryption key', () => {
		const encryptionKey = 'abcdefghijklmnop';
		const logger = createMock<LegacyLogger>();
		const encryptionService = new SymmetricKeyEncryptionService(logger, encryptionKey);
		const testInput = 'testInput';

		it('encrypts the input', () => {
			expect(encryptionService.encrypt(testInput)).not.toEqual(testInput);
		});

		it('should decrypt prior encrypted values', () => {
			// If the test fails because the encryption algorithm has been changed,
			// do not forget to migrate encrypted values in the database accordingly!
			// The following is a possible encryption of the testInput with the encryptionKey from above.
			const encrypted = 'Se4QcWKaOR6PcOQhByZ7f2f7yawfdATmXLxthH0TdYe4DzPRT24I2X4=';

			const decrypted = encryptionService.decrypt(encrypted);

			expect(decrypted).toEqual(testInput);
		});

		it('should not log warnings', () => {
			const encryptedValue = encryptionService.encrypt(testInput);
			encryptionService.decrypt(encryptedValue);
			expect(logger.warn).not.toHaveBeenCalled();
		});
	});

	describe('without configured encryption key', () => {
		const logger = createMock<LegacyLogger>();
		const encryptionService = new SymmetricKeyEncryptionService(logger);
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
