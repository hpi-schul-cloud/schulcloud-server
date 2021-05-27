import { ErrorResponse } from './error.response';

export class ValidationErrorDetailResponse {
	constructor(readonly field: string, readonly errors: string[]) {}
}
