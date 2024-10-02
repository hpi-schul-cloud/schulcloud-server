import { ClassConstructor, plainToClass, Transform, TransformFnParams } from 'class-transformer';

export function PolymorphicArrayTransform<T>(
	constructorDiscriminatorFn: (obj: unknown) => ClassConstructor<T>
): PropertyDecorator {
	return Transform(
		(params: TransformFnParams): unknown => {
			if (!Array.isArray(params.value)) {
				return params.value;
			}

			const transformedArray: T[] = params.value.map((value: unknown) => {
				const constructor: ClassConstructor<T> = constructorDiscriminatorFn(value);

				const obj: T = plainToClass(constructor, value);

				return obj;
			});

			return transformedArray;
		},
		{ toClassOnly: true }
	);
}
