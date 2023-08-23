import { Allow, ValidationOptions } from 'class-validator';

/**
 * Set privacy protect context attribute in validation options.
 * This can be used to detect if a property value should be obfuscated in error logs or responses.
 * see e.g. ApiValidationError
 */
export function PrivacyProtect(validationOptions?: ValidationOptions): PropertyDecorator {
	// We can extend the @Allow decorator safely because properties that have validations are allowed anyway.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	return Allow({ ...validationOptions, context: { ...validationOptions?.context, privacyProtected: true } });
}
