import { NotImplementedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { StringToBoolean } from './index';

describe('ToBooleanTransformer Decorator', () => {
	describe('when transform a string to boolean', () => {
		class WithBooleanDto {
			@StringToBoolean()
			booleanProp: boolean;

			@StringToBoolean()
			optionalBooleanProp?: boolean;
		}

		it('should transform from string `1` and `true` to true', () => {
			const plainBool = { booleanProp: 'true' };
			let instance = plainToClass(WithBooleanDto, plainBool);
			expect(instance.booleanProp).toEqual(true);
			const plainNum = { booleanProp: '1' };
			instance = plainToClass(WithBooleanDto, plainNum);
			expect(instance.booleanProp).toEqual(true);
		});
		it('should transform `0` and `false` to false', () => {
			const plainBool = { booleanProp: 'false' };
			let instance = plainToClass(WithBooleanDto, plainBool);
			expect(instance.booleanProp).toEqual(false);
			const plainNum = { booleanProp: '0' };
			instance = plainToClass(WithBooleanDto, plainNum);
			expect(instance.booleanProp).toEqual(false);
		});

		it('should fail for other (non-string) boolish values', () => {
			const plainBool = { booleanProp: true };
			expect(() => plainToClass(WithBooleanDto, plainBool)).toThrow(NotImplementedException);

			const plainNum = { booleanProp: 0 };
			expect(() => plainToClass(WithBooleanDto, plainNum)).toThrow(NotImplementedException);
		});

		it('should fail for wrong input', () => {
			const plainStr = { booleanProp: 'hello' };
			expect(() => plainToClass(WithBooleanDto, plainStr)).toThrow(NotImplementedException);

			const plainObj = { booleanProp: {} };
			expect(() => plainToClass(WithBooleanDto, plainObj)).toThrow(NotImplementedException);
		});

		it('should ignore optional params when not given', () => {
			const plain = {
				booleanProp: 'true',
			};
			const instance = plainToClass(WithBooleanDto, plain);
			expect(instance.optionalBooleanProp).toEqual(undefined);
		});

		it('should support optional params when given', () => {
			const plain = {
				booleanProp: 'true',
				optionalBooleanProp: 'true',
			};
			const instance = plainToClass(WithBooleanDto, plain);
			expect(instance.optionalBooleanProp).toEqual(true);
		});
	});
});
