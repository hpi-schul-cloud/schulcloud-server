export class TypeGuard {
	static checkNumber(value: unknown): void {
		if (!TypeGuard.isNumber(value)) {
			throw new Error('Type is not a number');
		}
	}

	static isNumber(value: unknown): boolean {
		const isNumber = typeof value === 'number';

		return isNumber;
	}
}
