import { HttpStatus, ValidationError } from '@nestjs/common';
import { ApiValidationError } from './api-validation.error';

describe('API Validation Error', () => {
	describe('when creating an api validation error', () => {
		it('should generate default response with status', () => {
			const error = new ApiValidationError();
			const status = error.getStatus();
			expect(status).toEqual(400);
			expect(status).toEqual(HttpStatus.BAD_REQUEST);
			const response = error.getResponse();
			expect(response).toEqual({
				code: HttpStatus.BAD_REQUEST,
				message: 'API validation failed, see validationErrors for details',
				title: 'API Validation Error',
				type: 'API_VALIDATION_ERROR',
			});
		});

		it('should have validationErrors to be defined', () => {
			const validationErrors: ValidationError[] = [];
			const error = new ApiValidationError(validationErrors);
			expect(error).toHaveProperty('validationErrors');
		});
	});
});
