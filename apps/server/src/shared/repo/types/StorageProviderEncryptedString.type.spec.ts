import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { StorageProviderEncryptedStringType } from './StorageProviderEncryptedString.type';

describe('EncryptedString type', () => {
	describe('constructor', () => {
		it('should load cipher key from configuration when no key is given', () => {
			const configBefore = Configuration.toObject({ plainSecrets: true });
			Configuration.set('S3_KEY', 'ANY_KEY_OF_MIN_LENGTH_16');
			const test = () => new StorageProviderEncryptedStringType();
			expect(test).not.toThrow();
			Configuration.reset(configBefore);
		});
	});
	describe('serialization', () => {
		const S3_KEY = 'custom_cipher_key';
		const serializer = new StorageProviderEncryptedStringType(S3_KEY);
		const text = 'sample text input';
		const textEncrypted = 'U2FsdGVkX18XgTi2IeaC/EA6vE9N4bf/0oDEz7WuIH8RGMcVm1Yw7I+2PHGBTAxF'; // depends on S3_KEY

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
	});
});
