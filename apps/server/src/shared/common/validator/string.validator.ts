export class StringValidator {
	static isString(value: string) {
		return typeof value === 'string';
	}

	static isNotEmptyString(value: string, trim = false) {
		return StringValidator.isString(value) && trim ? value.trim().length > 0 : value.length > 0;
	}
}
