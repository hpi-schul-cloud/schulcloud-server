import { ClassConstructor, plainToClass, Transform, TransformFnParams } from 'class-transformer';

export function StringToObject(classType: ClassConstructor<unknown>): PropertyDecorator {
	return Transform((params: TransformFnParams): unknown => {
		if (typeof params.value === 'string') {
			const res: unknown = JSON.parse(params.value);

			const obj: unknown = plainToClass(classType, res, params.options);

			return obj;
		}

		return params.value;
	});
}
