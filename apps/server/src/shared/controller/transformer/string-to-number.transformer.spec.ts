import { plainToClass } from 'class-transformer';
import { StringToNumber } from './string-to-number.transformer';

describe('ToNumberTransformer Decorator', () => {
	describe('when transform a string to number', () => {
		class WithNumberDto {
			@StringToNumber()
			booleanProp!: boolean;
		}

		it('should transform from string to number', () => {
			const plainNum = { booleanProp: '123' };
			let instance = plainToClass(WithNumberDto, plainNum);
			expect(instance.booleanProp).toEqual(123);

			const plainNum2 = { booleanProp: '456' };
			instance = plainToClass(WithNumberDto, plainNum2);
			expect(instance.booleanProp).toEqual(456);
		});
	});
});
