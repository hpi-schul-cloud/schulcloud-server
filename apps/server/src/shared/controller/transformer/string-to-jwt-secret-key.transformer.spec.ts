import { plainToClass } from 'class-transformer';
import { StringToJwtSecretKey } from './string-to-jwt-secret-key.transformer';

describe('StringToJwtSecretKey()', () => {
	class TestDto {
		@StringToJwtSecretKey()
		key!: string;
	}
	it('should transform escaped newlines to actual newlines', () => {
		const plainString = { key: 'line1\\nline2\\nline3' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.key).toBe('line1\nline2\nline3');
	});

	it('should throw an error if the value is not a string', () => {
		const plainNumber = { key: 12345 };

		expect(() => plainToClass(TestDto, plainNumber)).toThrowError('Value is not a string');
	});
});
