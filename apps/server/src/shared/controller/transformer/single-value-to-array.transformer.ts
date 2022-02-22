import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Decorator to transform a given value to be an array if the value is not null or undefined.
 * Used to ensure an array even if only one parameter is given via rest which would set the value not as array.
 * @returns
 */
export function SingleValueToArrayTransformer<T>(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const value = params.obj[params.key] as unknown;
		if (value == null) return value;
		if (Array.isArray(value)) {
			return value as Array<T>;
		}
		return [value] as Array<T>;
	});
}
