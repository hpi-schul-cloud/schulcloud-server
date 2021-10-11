import { Transform, TransformFnParams } from 'class-transformer';
import { decode } from 'html-entities';

/**
 * Decorator to transform a string value so that all contained html entities are decoded.
 * @returns
 */
export function DecodeHtmlEntities(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const str = params.obj[params.key] as string;
		const res = decode(str);
		return res;
	});
}
