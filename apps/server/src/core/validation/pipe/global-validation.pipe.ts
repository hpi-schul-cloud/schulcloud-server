import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { getMetadataStorage } from 'class-validator';

/** *********************************************
 * Global Pipe setup
 * **********************************************
 * Validation of DTOs will base on type-checking
 * which is enabled by default. To you might use
 * the class-validator decorators to extend
 * validation.
 */
export class GlobalValidationPipe extends ValidationPipe {
	private readonly metadataStorage = getMetadataStorage();

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
			exceptionFactory: (errors: ValidationError[]) =>
				new ApiValidationError(this.obfuscatePrivacyProtectedValues(errors)),
			validationError: {
				// make sure target (DTO) is set on validation error
				// we need this to be able to get DTO metadata for the obfuscation check
				// see obfuscatePrivacyProtectedValues()
				target: true,
				value: true,
			},
		});
	}

	private obfuscatePrivacyProtectedValues(errors: ValidationError[]): ValidationError[] {
		return errors.map((e) => {
			const metadatas = this.metadataStorage.getTargetValidationMetadatas(e.target!.constructor, '', true, true);

			const obfuscateValue = metadatas.some(
				(validationMetadata) =>
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					validationMetadata.propertyName === e.property && validationMetadata.context?.privacyProtect
			);

			if (obfuscateValue) {
				e.value = '####';
			}

			return e;
		});
	}
}
