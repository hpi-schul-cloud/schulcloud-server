import { Transform, TransformFnParams } from 'class-transformer';

export function ToBoolean(): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const str = params.obj[params.key] as string;
		if (['1', 'true'].includes(str)) {
			return true;
		}
		if (['0', 'false'].includes(str)) {
			return false;
		}
		return params;
	});
}
