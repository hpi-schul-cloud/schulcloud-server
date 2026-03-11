import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Validates that a string is a valid bytes format as accepted by the `bytes` library
 * (used by body-parser). Valid formats include:
 * - Numbers as strings: '1024'
 * - Numbers with units: '100b', '1kb', '1mb', '1gb', '1tb', '1pb'
 * - Units are case-insensitive
 */
export function IsBytesString(validationOptions?: ValidationOptions): PropertyDecorator {
	return (object: object, propertyKey: string | symbol): void => {
		const propertyName = String(propertyKey);
		registerDecorator({
			name: 'isBytesString',
			target: object.constructor,
			propertyName,
			options: validationOptions,
			validator: {
				validate(value: unknown): boolean {
					if (typeof value !== 'string') {
						return false;
					}
					// Regex matches: optional number (integer or decimal) followed by optional unit (b, kb, mb, gb, tb, pb)
					// Examples: '100', '1.5kb', '4mb', '1GB', '500'
					const bytesRegex = /^\d+(\.\d+)?\s*(b|kb|mb|gb|tb|pb)?$/i;
					return bytesRegex.test(value.trim());
				},
				defaultMessage(): string {
					return `${propertyName} must be a valid bytes string (e.g., '100', '1kb', '4mb', '1gb')`;
				},
			},
		});
	};
}
