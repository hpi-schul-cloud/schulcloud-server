import { NotFound } from '@feathersjs/errors';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ApiValidationError, BusinessError } from '@shared/common';
import { ErrorLoggable } from './error.loggable';

class SampleBusinessError extends BusinessError {
	constructor() {
		super(
			{
				type: 'SAMPLE_ERROR',
				title: 'Sample Error',
				defaultMessage: 'sample error message',
			},
			HttpStatus.NOT_IMPLEMENTED
		);
	}
}

describe('ErrorLoggable', () => {
	describe('getLogMessage', () => {
		describe('when error is an ApiValidationError', () => {
			const setup = () => {
				const validationError1 = { property: 'foo', value: 'bar', constraints: { foo: 'must be baz' } };
				const validationError2 = { property: 'bla', value: 'bli', constraints: { bla: 'must be blub' } };
				const error = new ApiValidationError([validationError1, validationError2]);
				const errorLoggable = new ErrorLoggable(error);
				const expectedMessage = {
					validationErrors: [
						'Wrong property foo got bar : {"foo":"must be baz"}',
						'Wrong property bla got bli : {"bla":"must be blub"}',
					],
					type: 'API Validation Error',
					stack: error.stack,
				};

				return { errorLoggable, expectedMessage };
			};

			it('should return ErrorLogMessage with appropriate content', () => {
				const { errorLoggable, expectedMessage } = setup();

				const message = errorLoggable.getLogMessage();

				expect(message).toEqual(expectedMessage);
			});
		});

		describe('when error is a FeathersError', () => {
			const setup = () => {
				const error = new NotFound();
				const errorLoggable = new ErrorLoggable(error);
				const expectedMessage = {
					error,
					type: 'Feathers Error',
					stack: error.stack,
				};

				return { errorLoggable, expectedMessage };
			};

			it('should return ErrorLogMessage with appropriate error type', () => {
				const { errorLoggable, expectedMessage } = setup();

				const message = errorLoggable.getLogMessage();

				expect(message).toEqual(expectedMessage);
			});
		});

		describe('when error is a BusinessError', () => {
			const setup = () => {
				const error = new SampleBusinessError();
				const errorLoggable = new ErrorLoggable(error);
				const expectedMessage = {
					error,
					type: 'Business Error',
					stack: error.stack,
				};

				return { errorLoggable, expectedMessage };
			};

			it('should return ErrorLogMessage with appropriate error type', () => {
				const { errorLoggable, expectedMessage } = setup();

				const message = errorLoggable.getLogMessage();

				expect(message).toEqual(expectedMessage);
			});
		});

		describe('when error is a NestHttpException', () => {
			const setup = () => {
				const error = new BadRequestException();
				const errorLoggable = new ErrorLoggable(error);
				const expectedMessage = {
					error,
					type: 'Technical Error',
					stack: error.stack,
				};

				return { errorLoggable, expectedMessage };
			};

			it('should return ErrorLogMessage with appropriate error type', () => {
				const { errorLoggable, expectedMessage } = setup();

				const message = errorLoggable.getLogMessage();

				expect(message).toEqual(expectedMessage);
			});
		});

		describe('when error is a generic error', () => {
			const setup = () => {
				const error = new Error();
				const errorLoggable = new ErrorLoggable(error);
				const expectedMessage = {
					error,
					type: 'Unhandled or Unknown Error',
					stack: error.stack,
				};

				return { errorLoggable, expectedMessage };
			};

			it('should return ErrorLogMessage with appropriate error type', () => {
				const { errorLoggable, expectedMessage } = setup();

				const message = errorLoggable.getLogMessage();

				expect(message).toEqual(expectedMessage);
			});
		});
	});
});
