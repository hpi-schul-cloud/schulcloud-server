import { plainToClass } from 'class-transformer';
import { CommaSeparatedStringToArray } from './comma-separated-string-to-array.transformer';

describe('CommaSeparatedStringToArray()', () => {
	class TestDto {
		@CommaSeparatedStringToArray()
		items!: string[];
	}

	it('should transform a comma separated string to an array of trimmed strings', () => {
		const plainString = { items: 'value1, value2, value3' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.items).toEqual(['value1', 'value2', 'value3']);
	});

	it('should handle strings without spaces', () => {
		const plainString = { items: 'value1,value2,value3' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.items).toEqual(['value1', 'value2', 'value3']);
	});

	it('should handle single value', () => {
		const plainString = { items: 'single-value' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.items).toEqual(['single-value']);
	});

	it('should trim whitespace from each value', () => {
		const plainString = { items: '  value1  ,  value2  ,  value3  ' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.items).toEqual(['value1', 'value2', 'value3']);
	});

	it('should handle empty string', () => {
		const plainString = { items: '' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.items).toEqual([]);
	});

	it('should handle whitespace-only string', () => {
		const plainString = { items: '   ' };
		const instance = plainToClass(TestDto, plainString);

		expect(instance.items).toEqual([]);
	});

	it('should throw an error if the value is not a string', () => {
		const plainNumber = { items: 12345 };

		expect(() => plainToClass(TestDto, plainNumber)).toThrowError('Value is not a string');
	});

	it('should return array unchanged if value is already an array', () => {
		const plainArray = { items: ['value1', 'value2'] };
		const instance = plainToClass(TestDto, plainArray);

		expect(instance.items).toEqual(['value1', 'value2']);
	});
});
