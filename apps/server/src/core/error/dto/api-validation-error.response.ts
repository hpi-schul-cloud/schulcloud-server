import { ValidationError } from '@nestjs/common';
import { ApiValidationError } from '@shared/common';
import { ErrorResponse } from './error.response';
import { ValidationErrorDetailResponse } from './validation-error-detail.response';

/**
 * HTTP response definition for api validation errors.
 */
export class ApiValidationErrorResponse extends ErrorResponse {
	validationErrors: ValidationErrorDetailResponse[] = [];

	constructor(apiValidationError: ApiValidationError) {
		const { type, title, message, code } = apiValidationError;
		super(type, title, message, code);

		apiValidationError.validationErrors.forEach((validationError: ValidationError) => {
			this.extractValidationErrorDetails(validationError);
		});
	}

	private extractValidationErrorDetails(validationError: ValidationError, parentPropertyPath: string[] = []): void {
		const propertyPath: string[] = [...parentPropertyPath];
		if (validationError.property) {
			propertyPath.push(validationError.property);
		}

		if (validationError.constraints) {
			const errors: string[] = Object.values(validationError.constraints);
			this.validationErrors.push(new ValidationErrorDetailResponse(propertyPath, errors));
		}

		if (validationError.children) {
			validationError.children.forEach((childError: ValidationError) =>
				this.extractValidationErrorDetails(childError, propertyPath)
			);
		}
	}
}
