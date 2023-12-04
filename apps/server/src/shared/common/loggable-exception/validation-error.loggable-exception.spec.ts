import { ValidationError } from 'class-validator';
import { ValidationErrorLoggableException } from './validation-error.loggable-exception';

describe('ValidationErrorLoggableException', () => {
	describe('getLogMessage', () => {
		const setup = () => {
			const validationError: ValidationError = new ValidationError();

			const exception = new ValidationErrorLoggableException([validationError]);

			return {
				exception,
				validationError,
			};
		};

		it('should log the correct message', () => {
			const { exception, validationError } = setup();

			const result = exception.getLogMessage();

			expect(result).toEqual({
				type: 'VALIDATION_ERROR',
				stack: expect.any(String),
				data: {
					0: validationError.toString(false, undefined, undefined, true),
				},
			});
		});
	});
});
