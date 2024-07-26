import { TypeGuard } from './type.guard';

describe('TypeGuard', () => {
	describe('isError', () => {
		describe('when passing type of value is an Error', () => {
			it('should be return true', () => {
				expect(TypeGuard.isError(new Error())).toBe(true);
			});
		});

		describe('when passing type of value is NOT an Error', () => {
			it('should be return false', () => {
				expect(TypeGuard.isError(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isError(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isError({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isError('string')).toBe(false);
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

	describe('isArray', () => {
		describe('when passing type of value is an array', () => {
			it('should be return true', () => {
				expect(TypeGuard.isArray([])).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isArray(['', '', ''])).toBe(true);
			});
		});

		describe('when passing type of value is NOT an array', () => {
			it('should be return false', () => {
				expect(TypeGuard.isArray(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isArray(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isArray({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isArray(1)).toBe(false);
			});
		});
	});

	describe('checkArray', () => {
		describe('when passing type of value is an array', () => {
			it('should be return value', () => {
				expect(TypeGuard.checkArray([])).toEqual([]);
			});

			it('should be return value', () => {
				expect(TypeGuard.checkArray(['', '', ''])).toEqual(['', '', '']);
			});
		});

		describe('when passing type of value is NOT an array', () => {
			it('should throw an error', () => {
				expect(() => TypeGuard.checkArray(undefined)).toThrowError('Type is not an array.');
			});

			it('should throw an error', () => {
				expect(() => TypeGuard.checkArray(null)).toThrowError('Type is not an array.');
			});

			it('should throw an error', () => {
				expect(() => TypeGuard.checkArray({})).toThrowError('Type is not an array.');
			});

			it('should throw an error', () => {
				expect(() => TypeGuard.checkArray(1)).toThrowError('Type is not an array.');
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

		describe('when passing type of value is NOT an array with elements', () => {
			it('should be return false', () => {
				expect(TypeGuard.isArrayWithElements([])).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isArrayWithElements(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isArrayWithElements(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isArrayWithElements({})).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isArrayWithElements(1)).toBe(false);
			});
		});
	});

	describe('checkArrayWithElements', () => {
		describe('when passing type of value is an array', () => {
			it('should be return value', () => {
				expect(TypeGuard.checkArrayWithElements(['', '', ''])).toEqual(['', '', '']);
			});
		});

		describe('when passing type of value is NOT an array', () => {
			it('should throw an error', () => {
				expect(() => TypeGuard.checkArrayWithElements([])).toThrowError('Type is not an array with elements.');
			});

			it('should throw an error', () => {
				expect(() => TypeGuard.checkArrayWithElements(undefined)).toThrowError('Type is not an array with elements.');
			});

			it('should throw an error', () => {
				expect(() => TypeGuard.checkArrayWithElements(null)).toThrowError('Type is not an array with elements.');
			});

			it('should throw an error', () => {
				expect(() => TypeGuard.checkArrayWithElements({})).toThrowError('Type is not an array with elements.');
			});

			it('should throw an error', () => {
				expect(() => TypeGuard.checkArray(1)).toThrowError('Type is not an array with elements.');
			});
		});
	});

	describe('isDefinedObject', () => {
		describe('when passing type of value is an object', () => {
			it('should be return true', () => {
				expect(TypeGuard.isDefinedObject({})).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isDefinedObject({ a: 1 })).toBe(true);
			});

			it('should be return true', () => {
				expect(TypeGuard.isDefinedObject({ a: { b: 1 } })).toBe(true);
			});
		});

		describe('when passing type of value is NOT an object', () => {
			it('should be return false', () => {
				expect(TypeGuard.isDefinedObject(undefined)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isDefinedObject(null)).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isDefinedObject([])).toBe(false);
			});

			it('should be return false', () => {
				expect(TypeGuard.isDefinedObject('string')).toBe(false);
			});
		});
	});

	describe('checkDefinedObject', () => {
		describe('when passing type of value is an object', () => {
			it('should be return value', () => {
				expect(TypeGuard.checkDefinedObject({})).toEqual({});
			});

			it('should be return value', () => {
				expect(TypeGuard.checkDefinedObject({ a: 1 })).toEqual({ a: 1 });
			});

			it('should be return value', () => {
				expect(TypeGuard.checkDefinedObject({ a: { b: 1 } })).toEqual({ a: { b: 1 } });
			});
		});

		describe('when passing type of value is NOT an object', () => {
			it('should be return false', () => {
				expect(() => TypeGuard.checkDefinedObject(undefined)).toThrowError('Type is not an object');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkDefinedObject(null)).toThrowError('Type is not an object');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkDefinedObject([])).toThrowError('Type is not an object');
			});

			it('should be return false', () => {
				expect(() => TypeGuard.checkDefinedObject('string')).toThrowError('Type is not an object');
			});
		});
	});

	// getValueFromObjectKey

	// getValueFromDeepObjectKey

	// checkKeyInObject

	describe('checkNotNullOrUndefined', () => {
		describe('when value is null', () => {
			it('should throw error if it is passed', () => {
				expect(() => TypeGuard.checkNotNullOrUndefined(null, new Error('Test'))).toThrow('Test');
			});

			it('should throw default error if not error passed', () => {
				expect(() => TypeGuard.checkNotNullOrUndefined(null)).toThrow('Type is null.');
			});
		});

		describe('when value is undefined', () => {
			it('should throw error if it is passed', () => {
				expect(() => TypeGuard.checkNotNullOrUndefined(undefined, new Error('Test'))).toThrow('Test');
			});

			it('should throw default error if not error passed', () => {
				expect(() => TypeGuard.checkNotNullOrUndefined(undefined)).toThrow('Type is undefined.');
			});
		});

		describe('when value is defined', () => {
			it('should return value if error is passed', () => {
				expect(TypeGuard.checkNotNullOrUndefined('', new Error('Test'))).toBe('');
			});

			it('should return value', () => {
				expect(TypeGuard.checkNotNullOrUndefined('')).toBe('');
			});
		});
	});
});
