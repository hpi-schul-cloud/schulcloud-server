import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsBytesString } from './is-bytes-string.validator';

class TestClass {
	@IsBytesString()
	value!: string;
}

describe('IsBytesString Validator', () => {
	const createInstance = (value: unknown): TestClass => plainToInstance(TestClass, { value });

	describe('valid bytes strings', () => {
		const validValues = ['100', '1024', '1.5kb', '4mb', '1gb', '500tb', '2pb', '1KB', '4MB', '1GB', '100b', '1 mb'];

		it.each(validValues)('should accept "%s"', async (value) => {
			const instance = createInstance(value);
			const errors = await validate(instance);
			expect(errors).toHaveLength(0);
		});
	});

	describe('invalid bytes strings', () => {
		const invalidValues = ['abc', 'mb', '1xb', '1.2.3mb', '', '1eb', '1zb', null, undefined, 123, {}, []];

		it.each(invalidValues)('should reject "%s"', async (value) => {
			const instance = createInstance(value);
			const errors = await validate(instance);
			expect(errors).toHaveLength(1);
			expect(errors[0].constraints).toHaveProperty('isBytesString');
		});
	});
});
