export class ValidationErrorDetailResponse {
	constructor(readonly field: string, readonly errors: string[]) {}
}
