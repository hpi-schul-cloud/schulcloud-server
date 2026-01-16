import { plainToClass } from 'class-transformer';
import { StringToApiKeys } from './string-to-api-keys.transformer';

describe('StringToApiKeys()', () => {
	class TestDto {
		@StringToApiKeys()
		keys!: string[];
	}
	it('should transform a comma separated string to an array of API keys', () => {
		const plainString = { keys: 'desc1:token1,desc2:token2,token3' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.keys).toEqual(['token1', 'token2', 'token3']);
	});

	it('should throw an error if the value is not a string', () => {
		const plainNumber = { keys: 12345 };

		expect(() => plainToClass(TestDto, plainNumber)).toThrowError('Value is not a string');
	});
});
