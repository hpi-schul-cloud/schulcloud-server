import { plainToClass } from 'class-transformer';
import { NullToUndefined } from './null-to-undefined.transformer';

describe('NullToUndefined Decorator', () => {
	describe('when transforming an optionl value', () => {
		class WithOptionalDto {
			@NullToUndefined()
			optionalDate?: Date;
		}

		it('should transform from `null` to `undefined`', () => {
			const props = { optionalDate: null };
			const instance = plainToClass(WithOptionalDto, props);
			expect(instance.optionalDate).toEqual(undefined);
		});

		it('should transform from `undefined` to `undefined`', () => {
			const props = { optionalDate: undefined };
			const instance = plainToClass(WithOptionalDto, props);
			expect(instance.optionalDate).toEqual(undefined);
		});

		it('should transform from omitted property to `undefined`', () => {
			const props = {};
			const instance = plainToClass(WithOptionalDto, props);
			expect(instance.optionalDate).toEqual(undefined);
		});

		it('should transform from value to value', () => {
			const props = { optionalDate: new Date() };
			const instance = plainToClass(WithOptionalDto, props);
			expect(instance.optionalDate).toEqual(props.optionalDate);
		});
	});
});
