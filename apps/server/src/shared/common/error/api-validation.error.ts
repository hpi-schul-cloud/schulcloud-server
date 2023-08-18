import { HttpStatus, ValidationError } from '@nestjs/common';
import { getMetadataStorage } from 'class-validator';
import { BusinessError } from './business.error';

export class ApiValidationError extends BusinessError {
	readonly validationErrors: ValidationError[];

	private readonly metadataStorage = getMetadataStorage();

	constructor(validationErrors: ValidationError[] = []) {
		super(
			{
				type: 'API_VALIDATION_ERROR',
				title: 'API Validation Error',
				defaultMessage: 'API validation failed, see validationErrors for details',
			},
			HttpStatus.BAD_REQUEST
		);
		this.validationErrors = validationErrors.map((e) => {
			const metadatas = this.metadataStorage.getTargetValidationMetadatas(e.target!.constructor, '', true, true);

			const objuscateValue = metadatas.some(
				(validationMetadata) =>
					// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
					validationMetadata.propertyName === e.property && validationMetadata.context?.privacyProtect
			);

			if (objuscateValue) {
				e.value = '####';
			}

			return e;
		});
	}
}
