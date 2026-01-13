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
		const str = params.obj[params.key] as string;
		TypeGuard.checkString(str);

		return parseInt(str);
	});
}
