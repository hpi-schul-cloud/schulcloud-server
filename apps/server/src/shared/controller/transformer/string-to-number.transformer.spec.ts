import { plainToClass } from 'class-transformer';
import { StringToNumber } from './string-to-number.transformer';

describe('ToNumberTransformer Decorator', () => {
	describe('when transform a number to number', () => {
		class WithNumberDto {
			@StringToNumber()
			numberProp!: number;
		}

		it('should return the number as is', () => {
			const plainNum = { numberProp: 123 };
			let instance = plainToClass(WithNumberDto, plainNum);
			expect(instance.numberProp).toEqual(123);

			const plainNum2 = { numberProp: 456 };
			instance = plainToClass(WithNumberDto, plainNum2);
			expect(instance.numberProp).toEqual(456);
		});
	});

	describe('when transform a string to number', () => {
		class WithNumberDto {
			@StringToNumber()
			stringProp!: string;
		}

		it('should transform from string to number', () => {
			const plainNum = { stringProp: '123' };
			let instance = plainToClass(WithNumberDto, plainNum);
			expect(instance.stringProp).toEqual(123);

			const plainNum2 = { stringProp: '456' };
			instance = plainToClass(WithNumberDto, plainNum2);
			expect(instance.stringProp).toEqual(456);
		});
	});

	describe('when transform a non-string to number', () => {
		class WithNumberDto {
			@StringToNumber()
			booleanProp!: boolean;
		}

		it('should throw error', () => {
			const plainNum = { booleanProp: true };
			expect(() => plainToClass(WithNumberDto, plainNum)).toThrowError();

			const plainNum2 = { booleanProp: true };
			expect(() => plainToClass(WithNumberDto, plainNum2)).toThrowError();
		});
	});
});
