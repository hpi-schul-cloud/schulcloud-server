import { ErrorResponse } from './error.response';
import { type ValidationErrorDetailResponse } from './validation-error-detail.response';

/**
 * HTTP response definition for api validation errors.
 */
export class ApiValidationErrorResponse extends ErrorResponse {
	validationErrors: ValidationErrorDetailResponse[] = [];
}
