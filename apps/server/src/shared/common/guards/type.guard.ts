export class TypeGuard {
	static isError(value: unknown): value is Error {
		const isError = value instanceof Error;

		return isError;
	}

	static isNull(value: unknown): value is null {
		const isNull = value === null;

		return isNull;
	}

	static isUndefined(value: unknown): value is undefined {
		const isUndefined = value === undefined;

		return isUndefined;
	}

	static isNumber(value: unknown): value is number {
		const isNumber = typeof value === 'number';

		return isNumber;
	}

	static checkNumber(value: unknown): number {
		if (!TypeGuard.isNumber(value)) {
			throw new Error('Type is not a number');
		}

		return value;
	}

	static isString(value: unknown): value is string {
		const isString = typeof value === 'string';

		return isString;
	}

	static checkString(value: unknown): string {
		if (!TypeGuard.isString(value)) {
			throw new Error('Type is not a string');
		}

		return value;
	}

	static isArray(value: unknown): value is [] {
		const isArray = Array.isArray(value);

		return isArray;
	}

	static checkArray(value: unknown): [] {
		if (!TypeGuard.isArray(value)) {
			throw new Error('Type is not an array.');
		}

		return value;
	}

	static isArrayWithElements(value: unknown): value is [] {
		const isArrayWithElements = TypeGuard.isArray(value) && value.length > 0;

		return isArrayWithElements;
	}

	static checkArrayWithElements(value: unknown): [] {
		if (!TypeGuard.isArrayWithElements(value)) {
			throw new Error('Type is not an array with elements.');
		}

		return value;
	}

	static isDefinedObject(value: unknown): value is object {
		const isObject = typeof value === 'object' && !TypeGuard.isArray(value) && !TypeGuard.isNull(value);

		return isObject;
	}

	static checkDefinedObject(value: unknown): object {
		if (!TypeGuard.isDefinedObject(value)) {
			throw new Error('Type is not an object.');
		}

		return value;
	}

	/** @return undefined if no object or key do not exists, otherwise the value of the key. */
	static getValueFromObjectKey(value: unknown, key: string): unknown {
		TypeGuard.checkString(key);

		const result: unknown = TypeGuard.isDefinedObject(value) ? value[key] : undefined;

		return result;
	}

	static getValueFromDeepObjectKey(value: unknown, keyPath: string[]): unknown {
		TypeGuard.checkArrayWithElements(keyPath);

		let result: unknown = value;

		keyPath.forEach((key) => {
			result = TypeGuard.getValueFromObjectKey(result, key);
		});

		return result;
	}

	/** @return value of requested key in object. */
	static checkKeyInObject(value: unknown, key: string): unknown {
		TypeGuard.checkString(key);

		const object = TypeGuard.checkDefinedObject(value);

		if (!(key in object)) {
			throw new Error(`Object has no ${key}.`);
		}

		return object[key];
	}

	static checkNotNullOrUndefined<T>(value: T | null | undefined, toThrow?: Error): T {
		if (TypeGuard.isNull(value)) {
			throw toThrow || new Error('Type is null.');
		}

		if (TypeGuard.isUndefined(value)) {
			throw toThrow || new Error('Type is undefined.');
		}

		return value;
	}
}
