import { ErrorResponse } from './error.response';
import { ValidationErrorDetailResponse } from './validation-error-detail.response';

/**
 * HTTP response definition for api validation errors.
 */
export class ApiValidationErrorResponse {
	validationErrors: ValidationErrorDetailResponse[];
}
