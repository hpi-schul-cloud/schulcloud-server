type EnsureKeysAreSet<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export class TypeGuard {
	public static isError(value: unknown): value is Error {
		const isError = value instanceof Error;

		return isError;
	}

	public static isNull(value: unknown): value is null {
		const isNull = value === null;

		return isNull;
	}

	public static isUndefined(value: unknown): value is undefined {
		const isUndefined = value === undefined;

		return isUndefined;
	}

	public static isNumber(value: unknown): value is number {
		const isNumber = typeof value === 'number';

		return isNumber;
	}

	public static checkNumber(value: unknown): number {
		if (!TypeGuard.isNumber(value)) {
			throw new Error('Type is not a number');
		}

		return value;
	}

	public static isString(value: unknown): value is string {
		const isString = typeof value === 'string';

		return isString;
	}

	public static checkString(value: unknown): string {
		if (!TypeGuard.isString(value)) {
			throw new Error('Type is not a string');
		}

		return value;
	}

	public static isStringOfStrings<T>(value: unknown, values: T[]): value is T {
		const isStringOfValue = TypeGuard.isString(value) && values.includes(value as T);

		return isStringOfValue;
	}

	public static checkStringOfStrings<T>(value: unknown, values: T[]): T {
		if (!TypeGuard.isStringOfStrings(value, values)) {
			throw new Error('Value is not in strings');
		}

		return value;
	}

	public static isArray(value: unknown): value is [] {
		const isArray = Array.isArray(value);

		return isArray;
	}

	public static checkArray(value: unknown): [] {
		if (!TypeGuard.isArray(value)) {
			throw new Error('Type is not an array.');
		}

		return value;
	}

	public static isArrayWithElements(value: unknown): value is [] {
		const isArrayWithElements = TypeGuard.isArray(value) && value.length > 0;

		return isArrayWithElements;
	}

	public static checkArrayWithElements(value: unknown): [] {
		if (!TypeGuard.isArrayWithElements(value)) {
			throw new Error('Type is not an array with elements.');
		}

		return value;
	}

	public static isDefinedObject(value: unknown): value is object {
		const isObject = typeof value === 'object' && !TypeGuard.isArray(value) && !TypeGuard.isNull(value);

		return isObject;
	}

	public static checkDefinedObject(value: unknown): object {
		if (!TypeGuard.isDefinedObject(value)) {
			throw new Error('Type is not an object.');
		}

		return value;
	}

	/** @return undefined if no object or key do not exists, otherwise the value of the key. */
	public static getValueFromObjectKey(value: unknown, key: string): unknown {
		TypeGuard.checkString(key);

		const result: unknown = TypeGuard.isDefinedObject(value) ? value[key] : undefined;

		return result;
	}

	public static getValueFromDeepObjectKey(value: unknown, keyPath: string[]): unknown {
		TypeGuard.checkArrayWithElements(keyPath);

		let result: unknown = value;

		keyPath.forEach((key) => {
			result = TypeGuard.getValueFromObjectKey(result, key);
		});

		return result;
	}

	public static isEachKeyInObject<T extends Record<string, unknown>>(value: unknown, keys: (keyof T)[]): value is T {
		if (!TypeGuard.isDefinedObject(value) || !TypeGuard.isArray(keys)) {
			return false;
		}

		for (const key of keys) {
			TypeGuard.checkString(key);

			if (!(key in value)) {
				return false;
			}
		}

		return true;
	}

	/** @return value of requested key in object. */
	public static checkKeyInObject<T>(value: T, key: string, toThrow?: Error): unknown {
		TypeGuard.checkString(key);

		const object = TypeGuard.checkDefinedObject(value);

		if (!TypeGuard.isEachKeyInObject(object, [key])) {
			throw toThrow || new Error(`Object has no ${key}.`);
		}

		return object[key];
	}

	public static checkKeysInObject<T extends Record<string, unknown>>(
		value: unknown,
		keys: (keyof T)[],
		toThrow?: Error
	): T {
		const object = TypeGuard.checkDefinedObject(value);

		if (!TypeGuard.isEachKeyInObject(object, keys)) {
			throw (
				toThrow ||
				new Error(
					`Object has missing key. Required are: ${JSON.stringify(keys)}. Get object keys: ${JSON.stringify(
						Object.keys(object)
					)}`
				)
			);
		}

		return object;
	}

	public static checkKeysInInstance<T extends object, K extends keyof T>(
		obj: T,
		keys: K[],
		contextInfo = ''
	): EnsureKeysAreSet<T, K> {
		for (const key of keys) {
			if (!(key in obj) || obj[key] === undefined) {
				throw new Error(`Object lacks this property: ${String(key)}. ${contextInfo}`);
			}
		}
		return obj as EnsureKeysAreSet<T, K>;
	}

	public static checkNotNullOrUndefined<T>(value: T | null | undefined, toThrow?: Error): T {
		if (TypeGuard.isNull(value)) {
			throw toThrow || new Error('Type is null.');
		}

		if (TypeGuard.isUndefined(value)) {
			throw toThrow || new Error('Type is undefined.');
		}

		return value;
	}
}
