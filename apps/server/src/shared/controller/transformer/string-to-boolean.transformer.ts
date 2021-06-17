import { NotImplementedException } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Decorator to transform a boolish string value to a boolean.
 * Accepts: '1', 'true', '0', 'false' with type string only.
 * @returns
 * @throws {NotImplementedException} for other values
 */
export function StringToBoolean(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const str = params.obj[params.key] as string;
		if (['1', 'true'].includes(str)) {
			return true;
		}
		if (['0', 'false'].includes(str)) {
			return false;
		}
		throw new NotImplementedException("can only transform one of '1', 'true', '0', 'false' to a boolean");
	});
}
