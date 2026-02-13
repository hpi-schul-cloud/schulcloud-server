import { TypeGuard } from '@shared/common/guards';
import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Transforms a comma-separated string into an array of trimmed strings.
 * e.g. "value1, value2, value3" -> ["value1", "value2", "value3"]
 */
export function CommaSeparatedStringToArray(): PropertyDecorator {
	return Transform((params: TransformFnParams): unknown => {
		if (typeof params.value === 'string') {
			if (params.value.trim() === '') {
				return [];
			}
			return params.value.split(',').map((item: string) => item.trim());
		}

		if (TypeGuard.isArrayOfStrings(params.value)) {
			return params.value;
		}

		throw new Error(
			`Value is not a string. Received type: ${typeof params.value}, value: ${JSON.stringify(params.value)}`
		);
	});
}
