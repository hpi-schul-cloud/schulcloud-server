export class TypeGuard {
	public static isNotNull<T>(value: T | null): value is T {
		return value !== null;
	}
}
