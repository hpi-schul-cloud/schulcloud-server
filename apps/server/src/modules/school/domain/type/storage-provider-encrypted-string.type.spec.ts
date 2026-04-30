import { StorageProviderEncryptedStringType } from './storage-provider-encrypted-string.type';
import { AesEncryptionHelper } from '@shared/common/utils';

describe('EncryptedString type', () => {
	describe('serialization', () => {
		const S3_KEY = 'custom_cipher_key';
		const serializer = new StorageProviderEncryptedStringType(() => S3_KEY);
		const text = 'sample text input';
		const textEncrypted = AesEncryptionHelper.encrypt(text, S3_KEY);

		describe('When convertToDatabaseValue', () => {
			it('should pass null value', () => {
				const result = serializer.convertToDatabaseValue(null as unknown as undefined);
				expect(result).toBeNull();
			});
			it('should pass undefined value', () => {
				const result = serializer.convertToDatabaseValue(undefined);
				expect(result).toBeUndefined();
			});
			it('should pass empty string value', () => {
				const result = serializer.convertToDatabaseValue('');
				expect(result).toEqual('');
			});
			it('should encrypt not-empty string value', () => {
				const result = serializer.convertToDatabaseValue(text);
				// result is always different but with same length
				expect(result.length).toEqual(textEncrypted.length);
			});
		});

		describe('When convertToJSValue', () => {
			it('should pass null value', () => {
				const result = serializer.convertToJSValue(null as unknown as undefined);
				expect(result).toBeNull();
			});
			it('should pass undefined value', () => {
				const result = serializer.convertToJSValue(undefined as unknown as undefined);
				expect(result).toBeUndefined();
			});
			it('should pass empty string value', () => {
				const result = serializer.convertToJSValue('');
				expect(result).toEqual('');
			});
			it('should decrypt not-empty string value', () => {
				const result = serializer.convertToJSValue(textEncrypted);
				expect(result).toEqual(text);
			});
		});

		describe('When S3_KEY environment variable is not defined', () => {
			it('should throw an error', () => {
				const serializerWithoutKey = new StorageProviderEncryptedStringType(() => undefined);

				expect(() => serializerWithoutKey.convertToDatabaseValue('test')).toThrow(
					'Environment variable S3_KEY is not defined'
				);
			});
		});

		describe('when using defaultGetS3KeyFn and variable is not defined', () => {
			let originalS3Key: string | undefined;

			beforeEach(() => {
				// eslint-disable-next-line no-process-env
				originalS3Key = process.env.S3_KEY;
				// eslint-disable-next-line no-process-env
				delete process.env.S3_KEY;
			});

			afterEach(() => {
				if (originalS3Key !== undefined) {
					// eslint-disable-next-line no-process-env
					process.env.S3_KEY = originalS3Key;
				}
			});

			it('should throw an error', () => {
				const serializerWithDefaultFn = new StorageProviderEncryptedStringType();

				expect(() => serializerWithDefaultFn.convertToDatabaseValue('test')).toThrow(
					'Environment variable S3_KEY is not defined'
				);
			});
		});
	});
});
