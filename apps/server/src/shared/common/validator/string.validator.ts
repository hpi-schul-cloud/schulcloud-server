export class StringValidator {
	static isString(value?: string): value is string {
		const result = value != null && typeof value === 'string';
		if (result === true) {
			return true;
		}
		return false;
	}

	static isNotEmptyString(value?: string, trim = false): boolean {
		if (StringValidator.isString(value)) {
			const result = trim ? value.trim().length > 0 : value.length > 0;
			return result;
		}
		return false;
	}
}
