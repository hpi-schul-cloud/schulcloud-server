import { NotFound } from '@feathersjs/errors';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { BusinessError } from '@shared/common';
import { Logger } from '@src/core/logger';
import { ErrorResponse } from '../dto/error.response';
import { GlobalErrorFilter } from './global-error.filter';

describe('GlobalErrorFilter', () => {
	let errorFilter: GlobalErrorFilter;
	const logger: DeepMocked<Logger> = createMock<Logger>();
	beforeAll(() => {
		errorFilter = new GlobalErrorFilter(logger);
	});

	describe('createErrorResponse', () => {
		class SampleError extends BusinessError {
			constructor(message?: string) {
				super(
					{
						type: 'SAMPLE_ERROR',
						title: 'Sample Error',
						defaultMessage: message || 'default sample error message',
					},
					HttpStatus.NOT_IMPLEMENTED
				);
			}
		}
		it('should process a feathers error correctly', () => {
			const feathersError = new NotFound('Not found message');
			const result: ErrorResponse = errorFilter.createErrorResponse(feathersError);
			const expected: ErrorResponse = new ErrorResponse(
				'NOT_FOUND',
				'Not Found',
				'Not found message',
				HttpStatus.NOT_FOUND
			);
			expect(result).toStrictEqual(expected);
		});

		it('should process a business error correctly', () => {
			const errorMsg = 'Business error msg';
			const businessError = new SampleError(errorMsg);
			const result: ErrorResponse = errorFilter.createErrorResponse(businessError);
			const expected = new ErrorResponse('SAMPLE_ERROR', 'Sample Error', errorMsg, HttpStatus.NOT_IMPLEMENTED);
			expect(result).toStrictEqual(expected);
		});

		it('should process a nest error without parameters correctly', () => {
			const nestError = new NotFoundException();
			const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
			const expected: ErrorResponse = new ErrorResponse('NOT_FOUND', 'Not Found', 'Not Found', HttpStatus.NOT_FOUND);
			expect(result).toStrictEqual(expected);
		});

		it('should process a nest error with message correctly', () => {
			const errorMsg = 'Nest error msg';
			const nestError = new NotFoundException(errorMsg);
			const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
			const expected: ErrorResponse = new ErrorResponse('NOT_FOUND', 'Not Found', errorMsg, HttpStatus.NOT_FOUND);
			expect(result).toStrictEqual(expected);
		});

		it('should process a nest error with message and description correctly', () => {
			const errorMsg = 'Nest error msg';
			const description = 'Nest error description';
			const nestError = new NotFoundException(errorMsg, description);
			const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
			const expected: ErrorResponse = new ErrorResponse('NOT_FOUND', 'Not Found', errorMsg, HttpStatus.NOT_FOUND);
			expect(result).toStrictEqual(expected);
		});

		it('should process a nest error with data object correctly', () => {
			const errorObj = { msg: 'Nest error msg' };
			const nestError = new NotFoundException(errorObj);
			const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
			const expected: ErrorResponse = new ErrorResponse(
				'NOT_FOUND',
				'Not Found',
				'Not Found Exception',
				HttpStatus.NOT_FOUND
			);
			expect(result).toStrictEqual(expected);
		});

		it('should process a nest error with data object and description correctly', () => {
			const errorObj = { msg: 'Nest error msg' };
			const description = 'Nest error description';
			const nestError = new NotFoundException(errorObj, description);
			const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
			const expected: ErrorResponse = new ErrorResponse(
				'NOT_FOUND',
				'Not Found',
				'Not Found Exception',
				HttpStatus.NOT_FOUND
			);
			expect(result).toStrictEqual(expected);
		});

		it('should not publish (error details) for default errors with custom message', () => {
			const errorMsg = 'technical details message';
			const unknownError = new Error(errorMsg);
			const result: ErrorResponse = errorFilter.createErrorResponse(unknownError);
			const expected: ErrorResponse = new ErrorResponse(
				'INTERNAL_SERVER_ERROR',
				'Internal Server Error',
				'Internal Server Error',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
			expect(result).toStrictEqual(expected);
			expect(result.message).toEqual('Internal Server Error');
			expect(result.message).not.toEqual(errorMsg);
		});

		it('should not publish (error details) for default errors with default message', () => {
			const unknownError = new Error();
			const result: ErrorResponse = errorFilter.createErrorResponse(unknownError);
			const expected: ErrorResponse = new ErrorResponse(
				'INTERNAL_SERVER_ERROR',
				'Internal Server Error',
				'Internal Server Error',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
			expect(result).toStrictEqual(expected);
			expect(result.message).toEqual('Internal Server Error');
		});

		it('should process error response correctly in case of processing failure', () => {
			class ShouldFailError extends SampleError {
				getResponse(): ErrorResponse {
					throw new Error('Should fail');
				}
			}
			const shouldFailError = new ShouldFailError('');
			const result: ErrorResponse = errorFilter.createErrorResponse(shouldFailError);
			const expected: ErrorResponse = new ErrorResponse(
				'INTERNAL_SERVER_ERROR',
				'Internal Server Error',
				'Internal Server Error',
				HttpStatus.INTERNAL_SERVER_ERROR
			);
			expect(result).toStrictEqual(expected);
		});
	});
});
