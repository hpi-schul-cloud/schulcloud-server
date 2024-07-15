import { TypeGuard } from './type.guard';

describe('TypeGuard', () => {
	describe('isNumber', () => {
		describe('when passing type of value is a number', () => {
			it('should be return true', () => {
				expect(TypeGuard.isNumber(123)).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isNumber(-1)).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isNumber(NaN)).toBe(true);
			});
		});

		describe('when passing type of value is NOT a number', () => {
			it('should be return false', () => {
				expect(TypeGuard.isNumber(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNumber(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNumber({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNumber('string')).toBe(false);
			});
		});
	});

	describe('checkNumber', () => {
		describe('when passing type of value is a number', () => {
			it('should be return value', () => {
				expect(TypeGuard.checkNumber(123)).toEqual(123);
			});

			it('should be return value', () => {
				expect(TypeGuard.checkNumber(-1)).toEqual(-1);
			});

			it('should be return value', () => {
				expect(TypeGuard.checkNumber(NaN)).toEqual(NaN);
			});
		});

		describe('when passing type of value is NOT a number', () => {
			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber(undefined)).toThrowError('Type is not a number');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber(null)).toThrowError('Type is not a number');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber({})).toThrowError('Type is not a number');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkNumber('string')).toThrowError('Type is not a number');
			});
		});
	});

	describe('isArrayWithElements', () => {
		describe('when passing type of value is an array with elements', () => {
			it('should be return true', () => {
				expect(TypeGuard.isArrayWithElements([1, 2, 3])).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isArrayWithElements(['a', 'b', 'c'])).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isArrayWithElements([{ a: 1 }, { b: 2 }])).toBe(true);
			});
		});
	});

	describe('isObject', () => {
		describe('when passing type of value is an object', () => {
			it('should be return true', () => {
				expect(TypeGuard.isObject({})).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isObject({ a: 1 })).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isObject({ a: { b: 1 } })).toBe(true);
			});
		});

		describe('when passing type of value is NOT an object', () => {
			it('should be return false', () => {
				expect(TypeGuard.isObject(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isObject(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isObject([])).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isObject('string')).toBe(false);
			});
		});
	});

	describe('checkObject', () => {
		describe('when passing type of value is an object', () => {
			it('should be return value', () => {
				expect(TypeGuard.checkObject({})).toEqual({});
			});

			it('should be return value', () => {
				expect(TypeGuard.checkObject({ a: 1 })).toEqual({ a: 1 });
			});

			it('should be return value', () => {
				expect(TypeGuard.checkObject({ a: { b: 1 } })).toEqual({ a: { b: 1 } });
			});
		});

		describe('when passing type of value is NOT an object', () => {
			it('should be return false', () => {
				expect(() => TypeGuard.checkObject(undefined)).toThrowError('Type is not an object');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkObject(null)).toThrowError('Type is not an object');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkObject([])).toThrowError('Type is not an object');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkObject('string')).toThrowError('Type is not an object');
			});
		});
	});

	describe('isString', () => {
		describe('when passing type of value is a string', () => {
			it('should be return true', () => {
				expect(TypeGuard.isString('string')).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isString('')).toBe(true);
			});
		});

		describe('when passing type of value is NOT a string', () => {
			it('should be return false', () => {
				expect(TypeGuard.isString(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isString(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isString({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isString(1)).toBe(false);
			});
		});
	});

	describe('checkString', () => {
		describe('when passing type of value is a string', () => {
			it('should be return value', () => {
				expect(TypeGuard.checkString('string')).toEqual('string');
			});

			it('should be return value', () => {
				expect(TypeGuard.checkString('')).toEqual('');
			});
		});

		describe('when passing type of value is NOT a string', () => {
			it('should be return false', () => {
				expect(() => TypeGuard.checkString(undefined)).toThrowError('Type is not a string');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkString(null)).toThrowError('Type is not a string');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkString({})).toThrowError('Type is not a string');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkString(1)).toThrowError('Type is not a string');
			});
		});
	});

	describe('isNull', () => {
		describe('when passing type of value is null', () => {
			it('should be return true', () => {
				expect(TypeGuard.isNull(null)).toBe(true);
			});
		});

		describe('when passing type of value is NOT null', () => {
			it('should be return false', () => {
				expect(TypeGuard.isNull(undefined)).toBe(false);
			});

			it('should be return true', () => {
				expect(TypeGuard.isNull('string')).toBe(false);
			});

			it('should be return true', () => {
				expect(TypeGuard.isNull('')).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNull({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isNull(1)).toBe(false);
			});
		});
	});

	describe('isUndefined', () => {
		describe('when passing type of value is undefined', () => {
			it('should be return true', () => {
				expect(TypeGuard.isUndefined(undefined)).toBe(true);
			});
		});

		describe('when passing type of value is NOT undefined', () => {
			it('should be return false', () => {
				expect(TypeGuard.isUndefined(null)).toBe(false);
			});

			it('should be return true', () => {
				expect(TypeGuard.isUndefined('string')).toBe(false);
			});

			it('should be return true', () => {
				expect(TypeGuard.isUndefined('')).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isUndefined({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isUndefined(1)).toBe(false);
			});
		});
	});

	describe('checkNotNullOrUndefined', () => {
		describe('when value is null', () => {
			const setup = () => {
				const value = null;

				return { value };
			};

			it('should throw error if it is passed', () => {
				const value: string | null = null;
				expect(() => TypeGuard.checkNotNullOrUndefined(value, new Error('Test'))).toThrow('Test');
			});

			it('should throw default error if not error passed', () => {
				const { value } = setup();

				expect(() => TypeGuard.checkNotNullOrUndefined(value)).toThrow('Type is null.');
			});
		});

		describe('when value is undefined', () => {
			const setup = () => {
				const value = undefined;

				return { value };
			};

			it('should throw error if it is passed', () => {
				const { value } = setup();

				expect(() => TypeGuard.checkNotNullOrUndefined(value, new Error('Test'))).toThrow('Test');
			});

			it('should throw default error if not error passed', () => {
				const { value } = setup();

				expect(() => TypeGuard.checkNotNullOrUndefined(value)).toThrow('Type is undefined.');
			});
		});

		describe('when value is defined', () => {
			const setup = () => {
				const value = '';

				return { value };
			};

			it('should return value if error is passed', () => {
				const { value } = setup();

				expect(TypeGuard.checkNotNullOrUndefined(value, new Error('Test'))).toBe('');
			});

			it('should return value', () => {
				const { value } = setup();

				expect(TypeGuard.checkNotNullOrUndefined(value)).toBe('');
			});
		});
	});
});
