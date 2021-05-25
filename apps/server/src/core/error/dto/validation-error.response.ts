import { ErrorResponse } from './error.response';

export class ValidationError {
	constructor(readonly field: string, readonly error: string) {}
}

/**
 * Validation error enhances @ErrorResponse by field specific error messages.
 */
export class ValidationErrorResponse extends ErrorResponse {
	readonly validationErrors: ValidationError[];
}
