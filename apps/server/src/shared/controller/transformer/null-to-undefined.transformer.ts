import { Transform } from 'class-transformer';

/**
 * Decorator to replace a null value by undefined.
 * Can be used to make optinal values consistent.
 * Place after IsOptional decorator.
 * It will return undefined if the value is null.
 * @returns
 */
export function NullToUndefined(): PropertyDecorator {
	return Transform(({ value }): unknown => (value === null ? undefined : value));
}
