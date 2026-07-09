import { TypeGuard } from '@shared/common/guards';
import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Decorator to transform a number-string value to a number.
 * Place after IsNumber decorator.
 * @returns
 */
export function StringToNumber(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// Use class-transformer's resolved value to preserve defaults on plainToClassFromExist.
		const value = params.value;
			if (value === undefined || value === null) {
				return value;
			}

		if (typeof value === 'number') {
			return value;
		}

		TypeGuard.checkString(value);

		return parseInt(value as string);
	});
}
