import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Allowed Admin API keys (for accessing the Admin API). - A comma seperated list of strings where description is optional
 * e.g. [<description>:]<token>,[<description>:]<token>"
 */
export function StringToApiKeys(): PropertyDecorator {
	return Transform((params: TransformFnParams): unknown => {
		if (typeof params.value === 'string') {
			return params.value.split(',').map((part: string) => (part.split(':').pop() ?? '').trim());
		}

		throw new Error('Value is not a string');
	});
}
