import { TypeGuard } from './type.guard';

type ExampleObjectType = {
	id?: number;
	name?: string;
	email?: string;
};

describe('TypeGuard', () => {
	describe('isError', () => {
		describe('when passing type of value is an Error', () => {
			it('should return true', () => {
				expect(TypeGuard.isError(new Error())).toBe(true);
			});
		});

		describe('when passing type of value is NOT an Error', () => {
			it('should return false', () => {
				expect(TypeGuard.isError(undefined)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isError(null)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isError({})).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isError('string')).toBe(false);
			});
		});
	});

	describe('isNull', () => {
		describe('when passing type of value is null', () => {
			it('should return true', () => {
				expect(TypeGuard.isNull(null)).toBe(true);
			});
		});

		describe('when passing type of value is NOT null', () => {
			it('should return false', () => {
				expect(TypeGuard.isNull(undefined)).toBe(false);
			});

			it('should return true', () => {
				expect(TypeGuard.isNull('string')).toBe(false);
			});

			it('should return true', () => {
				expect(TypeGuard.isNull('')).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isNull({})).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isNull(1)).toBe(false);
			});
		});
	});

	describe('isUndefined', () => {
		describe('when passing type of value is undefined', () => {
			it('should return true', () => {
				expect(TypeGuard.isUndefined(undefined)).toBe(true);
			});
		});

		describe('when passing type of value is NOT undefined', () => {
			it('should return false', () => {
				expect(TypeGuard.isUndefined(null)).toBe(false);
			});

			it('should return true', () => {
				expect(TypeGuard.isUndefined('string')).toBe(false);
			});

			it('should return true', () => {
				expect(TypeGuard.isUndefined('')).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isUndefined({})).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isUndefined(1)).toBe(false);
			});
		});
	});

	describe('isNumber', () => {
		describe('when passing type of value is a number', () => {
			it('should return true', () => {
				expect(TypeGuard.isNumber(123)).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isNumber(-1)).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isNumber(NaN)).toBe(true);
			});
		});

		describe('when passing type of value is NOT a number', () => {
			it('should return false', () => {
				expect(TypeGuard.isNumber(undefined)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isNumber(null)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isNumber({})).toBe(false);
			});

			it('should return false', () => {
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
			it('should return false', () => {
				expect(() => TypeGuard.checkNumber(undefined)).toThrowError('Type is not a number');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkNumber(null)).toThrowError('Type is not a number');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkNumber({})).toThrowError('Type is not a number');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkNumber('string')).toThrowError('Type is not a number');
			});
		});
	});

	describe('isString', () => {
		describe('when passing type of value is a string', () => {
			it('should return true', () => {
				expect(TypeGuard.isString('string')).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isString('')).toBe(true);
			});
		});

		describe('when passing type of value is NOT a string', () => {
			it('should return false', () => {
				expect(TypeGuard.isString(undefined)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isString(null)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isString({})).toBe(false);
			});

			it('should return false', () => {
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
			it('should return false', () => {
				expect(() => TypeGuard.checkString(undefined)).toThrowError('Type is not a string');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkString(null)).toThrowError('Type is not a string');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkString({})).toThrowError('Type is not a string');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkString(1)).toThrowError('Type is not a string');
			});
		});
	});

	describe('isStringOfValues', () => {
		describe('when value is in values', () => {
			it('should return true', () => {
				const value = 'string';

				expect(TypeGuard.isStringOfStrings(value, [value])).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isStringOfStrings('string', ['string', ''])).toBe(true);
			});
		});

		describe('when value is NOT in values', () => {
			it('should return false', () => {
				expect(TypeGuard.isStringOfStrings(undefined, ['string'])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isStringOfStrings(null, ['string'])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isStringOfStrings({}, ['string'])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isStringOfStrings(1, ['string'])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isStringOfStrings('string', [''])).toBe(false);
			});
		});
	});

	describe('checkStringOfValues', () => {
		describe('when value is in values', () => {
			it('should return string', () => {
				const value = 'string';

				const result = TypeGuard.checkStringOfStrings(value, [value]);

				expect(result).toBe(value);
			});

			it('should return string', () => {
				const value = 'string';

				const result = TypeGuard.checkStringOfStrings(value, [value, ' ']);

				expect(result).toBe(value);
			});
		});

		describe('when value is NOT in values', () => {
			const buildError = () => new Error('Value is not in strings');

			it('should throw an error', () => {
				const error = buildError();

				expect(() => TypeGuard.checkStringOfStrings(undefined, ['string'])).toThrowError(error);
			});

			it('should throw an error', () => {
				const error = buildError();

				expect(() => TypeGuard.checkStringOfStrings(null, ['string'])).toThrowError(error);
			});

			it('should throw an error', () => {
				const error = buildError();

				expect(() => TypeGuard.checkStringOfStrings({}, ['string'])).toThrowError(error);
			});

			it('should throw an error', () => {
				const error = buildError();
				expect(() => TypeGuard.checkStringOfStrings(1, ['string'])).toThrowError(error);
			});

			it('should throw an error', () => {
				const error = buildError();

				expect(() => TypeGuard.checkStringOfStrings('string', [''])).toThrowError(error);
			});
		});
	});

	describe('isArray', () => {
		describe('when passing type of value is an array', () => {
			it('should return true', () => {
				expect(TypeGuard.isArray([])).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isArray(['', '', ''])).toBe(true);
			});
		});

		describe('when passing type of value is NOT an array', () => {
			it('should return false', () => {
				expect(TypeGuard.isArray(undefined)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isArray(null)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isArray({})).toBe(false);
			});

			it('should return false', () => {
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
			it('should return true', () => {
				expect(TypeGuard.isArrayWithElements([1, 2, 3])).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isArrayWithElements(['a', 'b', 'c'])).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isArrayWithElements([{ a: 1 }, { b: 2 }])).toBe(true);
			});
		});

		describe('when passing type of value is NOT an array with elements', () => {
			it('should return false', () => {
				expect(TypeGuard.isArrayWithElements([])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isArrayWithElements(undefined)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isArrayWithElements(null)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isArrayWithElements({})).toBe(false);
			});

			it('should return false', () => {
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
				expect(() => TypeGuard.checkArrayWithElements(1)).toThrowError('Type is not an array with elements.');
			});
		});
	});

	describe('isDefinedObject', () => {
		describe('when passing type of value is an object', () => {
			it('should return true', () => {
				expect(TypeGuard.isDefinedObject({})).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isDefinedObject({ a: 1 })).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isDefinedObject({ a: { b: 1 } })).toBe(true);
			});
		});

		describe('when passing type of value is NOT an object', () => {
			it('should return false', () => {
				expect(TypeGuard.isDefinedObject(undefined)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isDefinedObject(null)).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isDefinedObject([])).toBe(false);
			});

			it('should return false', () => {
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
			it('should return false', () => {
				expect(() => TypeGuard.checkDefinedObject(undefined)).toThrowError('Type is not an object');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkDefinedObject(null)).toThrowError('Type is not an object');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkDefinedObject([])).toThrowError('Type is not an object');
			});

			it('should return false', () => {
				expect(() => TypeGuard.checkDefinedObject('string')).toThrowError('Type is not an object');
			});
		});
	});

	describe('getValueFromObjectKey', () => {
		describe('when passing value is an object that has the requested key', () => {
			it('should be return the key value', () => {
				expect(TypeGuard.getValueFromObjectKey({ xyz: 'abc' }, 'xyz')).toEqual('abc');
			});
		});

		describe('when passing value and key do not match', () => {
			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromObjectKey({ xyz: 'abc' }, 'zzz')).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromObjectKey([], 'zzz')).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromObjectKey('string', 'zzz')).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromObjectKey(1, 'zzz')).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromObjectKey(null, 'zzz')).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromObjectKey(undefined, 'zzz')).toBeUndefined();
			});
		});

		describe('when param contract is not fullfilled', () => {
			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.getValueFromObjectKey({ xyz: 'abc' }, undefined)).toThrowError('Type is not a string');
			});

			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.getValueFromObjectKey({ xyz: 'abc' }, null)).toThrowError('Type is not a string');
			});

			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.getValueFromObjectKey({ xyz: 'abc' }, 1)).toThrowError('Type is not a string');
			});
		});
	});

	describe('getValueFromDeepObjectKey', () => {
		describe('when passing value is an object that has the requested key path', () => {
			it('should be return the key value', () => {
				expect(TypeGuard.getValueFromDeepObjectKey({ x1: { x2: 'abc' } }, ['x1', 'x2'])).toEqual('abc');
			});
		});

		describe('when passing value and key path do not match', () => {
			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromDeepObjectKey({ xyz: 'abc' }, ['x1', 'x2'])).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromDeepObjectKey({ x1: { zzz: 'abc' } }, ['x1', 'x2'])).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromDeepObjectKey([], ['x1', 'x2'])).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromDeepObjectKey('string', ['x1', 'x2'])).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromDeepObjectKey(1, ['x1', 'x2'])).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromDeepObjectKey(null, ['x1', 'x2'])).toBeUndefined();
			});

			it('should be return undefined', () => {
				expect(TypeGuard.getValueFromDeepObjectKey(undefined, ['x1', 'x2'])).toBeUndefined();
			});
		});

		describe('when param contract is not fullfilled', () => {
			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.getValueFromDeepObjectKey({ x1: { x2: 'abc' } }, undefined)).toThrowError(
					'Type is not an array with elements.'
				);
			});

			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.getValueFromDeepObjectKey({ x1: { x2: 'abc' } }, null)).toThrowError(
					'Type is not an array with elements.'
				);
			});

			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.getValueFromDeepObjectKey({ x1: { x2: 'abc' } }, 1)).toThrowError(
					'Type is not an array with elements.'
				);
			});
		});
	});

	describe('isEachKeyInObject', () => {
		describe('when passing value is an object that has all requested keys', () => {
			it('should return true', () => {
				expect(TypeGuard.isEachKeyInObject({ x1: 'abc', x2: 'bcd' }, ['x1', 'x2'])).toBe(true);
			});

			it('should return true', () => {
				expect(TypeGuard.isEachKeyInObject({ x1: 'abc', x2: 'bcd' }, ['x1'])).toBe(true);
			});
		});

		describe('when passing params do not match', () => {
			it('should return false', () => {
				expect(TypeGuard.isEachKeyInObject({ x1: 'abc', x2: 'bcd' }, ['x1', 'x2', 'x3'])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isEachKeyInObject({ x1: 'abc', x2: 'bcd' }, 'x1' as unknown as string[])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isEachKeyInObject('string', ['x1', 'x2'])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isEachKeyInObject(undefined, ['x1', 'x2'])).toBe(false);
			});

			it('should return false', () => {
				expect(TypeGuard.isEachKeyInObject(null, ['x1', 'x2'])).toBe(false);
			});
		});
	});

	describe('checkKeyInObject', () => {
		describe('when passing value is an object that has the requested key', () => {
			it('should be return the key value', () => {
				const result = TypeGuard.checkKeyInObject({ xyz: 'abc' }, 'xyz');

				expect(result).toEqual('abc');
			});
		});

		describe('when passing value and key do not match', () => {
			it('should be throw an error', () => {
				expect(() => TypeGuard.checkKeyInObject({ xyz: 'abc' }, 'zzz')).toThrowError('Object has no zzz.');
			});

			it('should be throw an error', () => {
				expect(() => TypeGuard.checkKeyInObject([], 'zzz')).toThrowError('Type is not an object.');
			});

			it('should be throw an error', () => {
				expect(() => TypeGuard.checkKeyInObject('string', 'zzz')).toThrowError('Type is not an object.');
			});

			it('should be throw an error', () => {
				expect(() => TypeGuard.checkKeyInObject(1, 'zzz')).toThrowError('Type is not an object.');
			});

			it('should be throw an error', () => {
				expect(() => TypeGuard.checkKeyInObject(null, 'zzz')).toThrowError('Type is not an object.');
			});

			it('should be throw an error', () => {
				expect(() => TypeGuard.checkKeyInObject(undefined, 'zzz')).toThrowError('Type is not an object.');
			});
		});

		describe('when param contract is not fullfilled', () => {
			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.checkKeyInObject({ xyz: 'abc' }, undefined)).toThrowError('Type is not a string');
			});

			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.checkKeyInObject({ xyz: 'abc' }, null)).toThrowError('Type is not a string');
			});

			it('should be throw an error', () => {
				// @ts-expect-error test-case
				expect(() => TypeGuard.checkKeyInObject({ xyz: 'abc' }, 1)).toThrowError('Type is not a string');
			});
		});
	});

	describe('checkKeysInInstance', () => {
		describe('when passing value is an object that has the requested keys', () => {
			it('should be return the object', () => {
				const example: ExampleObjectType = { name: 'abc' };

				const checkedObject = TypeGuard.checkKeysInInstance(example, ['name']);

				expect(checkedObject).toEqual(example);
			});

			it('should know the property is defined', () => {
				const example: ExampleObjectType = { name: 'abc' };

				const checkedObject = TypeGuard.checkKeysInInstance(example, ['name']);

				expect(checkedObject.name).toEqual('abc');
			});
		});

		describe('when passing value and keys do not match', () => {
			it('should throw an error', () => {
				const example: ExampleObjectType = { id: 1, name: 'John Doe' };

				expect(() => TypeGuard.checkKeysInInstance(example, ['email'])).toThrowError(
					'Object lacks these properties: email.'
				);
			});

			it('should throw an error', () => {
				const example: ExampleObjectType = { id: 1, name: 'John Doe' };

				expect(() => TypeGuard.checkKeysInInstance(example, ['email'])).toThrowError(
					'Object lacks these properties: email.'
				);
			});
		});
	});

	describe('requireKeys', () => {
		describe('when passing value is an object that has the requested keys', () => {
			it('should not throw', () => {
				const example: ExampleObjectType = { name: 'abc' };

				expect(() => TypeGuard.requireKeys(example, ['name'])).not.toThrow();
			});
		});

		describe('when passing value and keys do not match', () => {
			it('should throw an error', () => {
				const example: ExampleObjectType = { id: 1, name: 'John Doe' };

				expect(() => TypeGuard.requireKeys(example, ['email'])).toThrowError('Object lacks these properties: email.');
			});
		});
	});

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
