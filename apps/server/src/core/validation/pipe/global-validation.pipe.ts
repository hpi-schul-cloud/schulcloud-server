import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiValidationError } from '../../error/errors/api-validation.error';

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
			exceptionFactory: (errors: ValidationError[]) => {
				return new ApiValidationError(errors);
			},
		});
	}
}
