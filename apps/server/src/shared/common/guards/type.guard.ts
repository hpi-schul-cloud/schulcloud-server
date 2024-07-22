export class TypeGuard {
	static checkNumber(value: unknown): number {
		if (!TypeGuard.isNumber(value)) {
			throw new Error('Type is not a number');
		}

		return value;
	}

	static isNumber(value: unknown): value is number {
		const isNumber = typeof value === 'number';

		return isNumber;
	}

	static checkString(value: unknown): string {
		if (!TypeGuard.isString(value)) {
			throw new Error('Type is not a string');
		}

		return value;
	}

	static isString(value: unknown): value is string {
		const isString = typeof value === 'string';

		return isString;
	}

	static isArrayWithElements(value: unknown): value is [] {
		const isArrayWithElements = Array.isArray(value) && value.length > 0;

		return isArrayWithElements;
	}

	static checkObject(value: unknown): object {
		if (!TypeGuard.isObject(value)) {
			throw new Error('Type is not an object');
		}

		return value;
	}

	static isObject(value: unknown): value is object {
		const isObject = typeof value === 'object' && !Array.isArray(value) && value !== null;

		return isObject;
	}

	static isNull(value: unknown): value is null {
		const isNull = value === null;

		return isNull;
	}

	static isUndefined(value: unknown): value is undefined {
		const isUndefined = value === undefined;

		return isUndefined;
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
