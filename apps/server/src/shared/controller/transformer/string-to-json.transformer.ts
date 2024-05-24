import { plainToClass, Transform, TransformFnParams } from 'class-transformer';
import { ClassConstructor } from 'class-transformer/types/interfaces';

export function StringToObject(classType: ClassConstructor<unknown>): PropertyDecorator {
	return Transform((params: TransformFnParams) => {
		if (typeof params.value === 'string') {
			const res: unknown = JSON.parse(params.value);

			const obj: unknown = plainToClass(classType, res, params.options);

			return obj;
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return params.value;
	});
}
