import { HttpStatus, ValidationError } from '@nestjs/common';
import { ApiValidationErrorResponse } from '../dto/api-validation-error.response';
import { ValidationErrorDetailResponse } from '../dto/validation-error-detail.response';
import { BusinessError } from './business.error';

export class ApiValidationError extends BusinessError {
	constructor(validationErrors: ValidationError[]) {
		super(
			{
				type: 'API_VALIDATION_ERROR',
				title: 'API Validation Error',
				defaultMessage: 'API validation failed, see validationErrors for details',
			},
			HttpStatus.BAD_REQUEST,
			ApiValidationError.createValidationResponseFromValidationErrors(validationErrors)
		);
	}
	static createValidationResponseFromValidationErrors(validationErrors: ValidationError[]): ApiValidationErrorResponse {
		const result = validationErrors.map((validationError) => {
			const errors = Object.values(validationError.constraints || {}) || [];
			return new ValidationErrorDetailResponse(validationError.property, errors);
		});
		return { validationErrors: result };
	}
}
