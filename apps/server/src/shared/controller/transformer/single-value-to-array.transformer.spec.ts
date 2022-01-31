import { plainToClass } from 'class-transformer';
import { SingleValueToArrayTransformer } from './index';

describe('ToBooleanTransformer Decorator', () => {
	describe('when transform a string to boolean', () => {
		class OptionalArrayDto {
			@SingleValueToArrayTransformer()
			givenProp!: string[]; // or string from rest

			@SingleValueToArrayTransformer()
			optionalProp?: string[]; // or string from rest
		}
		it('should transform non-array values to ensure result is an array', () => {
			const data = { givenProp: 'foo' };
			const instance = plainToClass(OptionalArrayDto, data);
			expect(instance.givenProp).toEqual(expect.arrayContaining(['foo']));
		});
		it('should not transform array values again', () => {
			const data = { givenProp: ['foo'] };
			const instance = plainToClass(OptionalArrayDto, data);
			expect(instance.givenProp).toEqual(expect.arrayContaining(['foo']));
		});
		it('should not transform null', () => {
			const data = { givenProp: null };
			const instance = plainToClass(OptionalArrayDto, data);
			expect(instance.givenProp).toBeNull();
		});
		it('should not transform undefined', () => {
			const data = { givenProp: undefined };
			const instance = plainToClass(OptionalArrayDto, data);
			expect(instance.givenProp).toBeUndefined();
		});
		it('should skip optional property as undefined', () => {
			const data = {};
			const instance = plainToClass(OptionalArrayDto, data);
			expect(instance.optionalProp).toBeUndefined();
		});
	});
});
