import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';

/** *********************************************
 * Global Pipe setup
 * **********************************************
 * Validation of DTOs will base on type-checking
 * which is enabled by default. To you might use
 * the class-validator decorators to extend
 * validation.
 */
export class GlobalValidationPipe extends ValidationPipe {
	constructor() {
		super({
			// enable DTO instance creation for incoming data
			transform: true,
			transformOptions: {
				// enable type coersion, requires transform:true
				enableImplicitConversion: true,
			},
			whitelist: true, // only pass valid @ApiProperty-decorated DTO properties, remove others
			forbidNonWhitelisted: false, // additional params are just skipped (required when extracting multiple DTO from single query)
			forbidUnknownValues: true,
			exceptionFactory: (errors: ValidationError[]) => new ApiValidationError(errors),
			validationError: {
				// make sure target (DTO) is set on validation error
				// we need this to be able to get DTO metadata for checking if a value has to be the obfuscated on output
				// see e.g. ErrorLoggable
				target: true,
				value: true,
			},
		});
	}
}
