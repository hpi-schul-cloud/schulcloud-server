import { type ValidationError } from '@nestjs/common';
import { type ApiValidationError } from '@shared/common/error';
import { ApiValidationErrorResponse } from '../dto/api-validation-error.response';
import { ValidationErrorDetailResponse } from '../dto/validation-error-detail.response';

export class ApiValidationErrorResponseFactory {
	public static fromApiValidationError(error: ApiValidationError): ApiValidationErrorResponse {
		const { type, title, message, code } = error;
		const response = new ApiValidationErrorResponse(type, title, message, code);

		response.validationErrors = ApiValidationErrorResponseFactory.extractDetails(error.validationErrors);

		return response;
	}

	private static extractDetails(errors: ValidationError[], parentPath: string[] = []): ValidationErrorDetailResponse[] {
		const result: ValidationErrorDetailResponse[] = [];

		for (const error of errors) {
			const path = [...parentPath];
			if (error.property) {
				path.push(error.property);
			}

			if (error.constraints) {
				result.push(new ValidationErrorDetailResponse(path, Object.values(error.constraints)));
			}

			if (error.children) {
				result.push(...ApiValidationErrorResponseFactory.extractDetails(error.children, path));
			}
		}

		return result;
	}
}
