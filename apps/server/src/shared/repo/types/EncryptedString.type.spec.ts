import { Platform } from '@mikro-orm/core';
import { EncryptedStringType } from './EncryptedString.type';

describe('EncryptedString type', () => {
	const serializer = new EncryptedStringType();
	const text = 'sample text input';
	const textEncrypted = 'U2FsdGVkX19f3ahtkMU8/Sma2NLiDhv6Pqdcoh0Co7EPwTiluyDZgR+6mtq6FeWR';

	describe('When convertToDatabaseValue', () => {
		it('should pass null value', () => {
			const result = serializer.convertToDatabaseValue(null as unknown as undefined, undefined as unknown as Platform);
			expect(result).toBeNull();
		});
		it('should pass undefined value', () => {
			const result = serializer.convertToDatabaseValue(undefined, undefined as unknown as Platform);
			expect(result).toBeUndefined();
		});
		it('should pass empty string value', () => {
			const result = serializer.convertToDatabaseValue('', undefined as unknown as Platform);
			expect(result).toEqual('');
		});
		it('should encrypt not-empty string value', () => {
			const result = serializer.convertToDatabaseValue(text, undefined as unknown as Platform);
			// result is always different but with same length
			expect(result.length).toEqual(textEncrypted.length);
		});
	});

	describe('When convertToJSValue', () => {
		it('should pass null value', () => {
			const result = serializer.convertToJSValue(null as unknown as undefined, undefined as unknown as Platform);
			expect(result).toBeNull();
		});
		it('should pass undefined value', () => {
			const result = serializer.convertToJSValue(undefined as unknown as undefined, undefined as unknown as Platform);
			expect(result).toBeUndefined();
		});
		it('should pass empty string value', () => {
			const result = serializer.convertToJSValue('', undefined as unknown as Platform);
			expect(result).toEqual('');
		});
		it('should decrypt not-empty string value', () => {
			const result = serializer.convertToJSValue(textEncrypted, undefined as unknown as Platform);
			expect(result).toEqual(text);
		});
	});
});
