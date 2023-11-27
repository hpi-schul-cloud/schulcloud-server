export class GuardAgainst {
	/**
	 * Guards against null or undefined and throws specified exception.
	 * @param value The value to check.
	 * @param toThrow The exception to be thrown on failure.
	 * @returns The narrowed value or throws.
	 */
	static nullOrUndefined<T>(value: T | null | undefined, toThrow: unknown): T | never {
		if (value === null || value === undefined) {
			throw toThrow;
		}
		return value;
	}
}
