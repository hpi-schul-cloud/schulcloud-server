export function checkForNullOrUndefined<T>(value: T | undefined | null, name: string): T | never {
	if (value) {
		return value;
	}

	throw new Error(`${name} is null or undefined`);
}
