import { TypeGuard } from '@shared/common/guards';
import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Decorator to transform a number-string value to a number.
 * Place after IsNumber decorator.
 * @returns
 */
export function StringToNumber(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
		const value = params.obj[params.key];
		if (typeof value === 'number') {
			return value;
		}

		TypeGuard.checkString(value);

		return parseInt(value as string);
	});
}
