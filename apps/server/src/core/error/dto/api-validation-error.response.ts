import { ApiValidationError } from '@shared/common/error/api-validation.error';
import { ErrorResponse } from './error.response';
import { ValidationErrorDetailResponse } from './validation-error-detail.response';

/**
 * HTTP response definition for api validation errors.
 */
export class ApiValidationErrorResponse extends ErrorResponse {
	constructor(apiValidationError: ApiValidationError) {
		const { type, title, message, code } = apiValidationError;
		super(type, title, message, code);

		this.validationErrors = apiValidationError.validationErrors.map((validationError) => {
			const constraint = validationError.constraints ? validationError.constraints : ['validation failed'];
			if (Array.isArray(constraint)) {
				return new ValidationErrorDetailResponse(validationError.property, constraint);
			}
			const errors = Object.values(constraint);
			return new ValidationErrorDetailResponse(validationError.property, errors);
		});
	}

	validationErrors: ValidationErrorDetailResponse[];
}
