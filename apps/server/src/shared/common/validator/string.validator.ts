export class StringValidator {
	public static isString(value?: string): value is string {
		const isString = value != null && typeof value === 'string';

		return isString;
	}

	public static isNotEmptyString(value?: string): boolean {
		return StringValidator.isString(value) && value.length > 0;
	}

	public static isNotEmptyStringWhenTrimed(value?: string): boolean {
		return StringValidator.isString(value) && value.trim().length > 0;
	}
}
