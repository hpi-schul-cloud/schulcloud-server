import { Transform, TransformFnParams } from 'class-transformer';

// Node's process.env escapes newlines. We need to reverse it for the keys to work.
// See: https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
export function StringToJwtSecretKey(): PropertyDecorator {
	return Transform((params: TransformFnParams): unknown => {
		if (typeof params.value === 'string') {
			return params.value.replace(/\\n/g, '\n');
		}

		throw new Error('Value is not a string');
	});
}
