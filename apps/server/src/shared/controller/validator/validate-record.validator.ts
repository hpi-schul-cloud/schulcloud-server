import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function ValidateRecord(validationFn: (value: unknown) => boolean, validationOptions?: ValidationOptions) {
	return (object: object, propertyName: string): void => {
		registerDecorator({
			name: 'ValidateRecord',
			target: object.constructor,
			propertyName,
			options: validationOptions,
			validator: {
				validate(value: unknown): boolean {
					if (typeof value !== 'object' || value === null) {
						return false;
					}
					return Object.values(value).every((val: unknown): boolean => validationFn(val));
				},
				defaultMessage(args: ValidationArguments): string {
					return `${args.property} must be a record with valid values`;
				},
			},
		});
	};
}
