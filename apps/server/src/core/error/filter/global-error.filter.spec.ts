import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BusinessError } from '@shared/common';
import { ErrorLogger } from '@src/core/logger';
import { GlobalErrorFilter } from './global-error.filter';

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

// TODO: Write tests
describe('GlobalErrorFilter', () => {
	let module: TestingModule;
	let service: GlobalErrorFilter<any>;
	let logger: DeepMocked<ErrorLogger>;

	const httpArgumentHost = createMock<ArgumentsHost>({
		getType: jest.fn().mockReturnValue('http'),
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				GlobalErrorFilter,
				{
					provide: ErrorLogger,
					useValue: createMock<ErrorLogger>(),
				},
			],
		}).compile();

		service = module.get(GlobalErrorFilter);
		logger = module.get(ErrorLogger);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('catch', () => {
		it('should log error', () => {
			const error = new SampleError();

			service.catch(error, httpArgumentHost);

			expect(logger.error).toBeCalled();
		});

		it('should send response', () => {
			const error = new SampleError();

			service.catch(error, httpArgumentHost);

			expect(httpArgumentHost.switchToHttp).toBeCalledTimes(1);
		});
	});

	// describe('createErrorResponse', () => {
	// 	it('should process a feathers error correctly', () => {
	// 		const feathersError = new NotFound('Not found message');
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(feathersError);
	// 		const expected: ErrorResponse = new ErrorResponse(
	// 			'NOT_FOUND',
	// 			'Not Found',
	// 			'Not found message',
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 		expect(result).toStrictEqual(expected);
	// 	});

	// 	it('should process a business error correctly', () => {
	// 		const errorMsg = 'Business error msg';
	// 		const businessError = new SampleError(errorMsg);
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(businessError);
	// 		const expected = new ErrorResponse('SAMPLE_ERROR', 'Sample Error', errorMsg, HttpStatus.NOT_IMPLEMENTED);
	// 		expect(result).toStrictEqual(expected);
	// 	});

	// 	it('should process a nest error without parameters correctly', () => {
	// 		const nestError = new NotFoundException();
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
	// 		const expected: ErrorResponse = new ErrorResponse('NOT_FOUND', 'Not Found', 'Not Found', HttpStatus.NOT_FOUND);
	// 		expect(result).toStrictEqual(expected);
	// 	});

	// 	it('should process a nest error with message correctly', () => {
	// 		const errorMsg = 'Nest error msg';
	// 		const nestError = new NotFoundException(errorMsg);
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
	// 		const expected: ErrorResponse = new ErrorResponse('NOT_FOUND', 'Not Found', errorMsg, HttpStatus.NOT_FOUND);
	// 		expect(result).toStrictEqual(expected);
	// 	});

	// 	it('should process a nest error with message and description correctly', () => {
	// 		const errorMsg = 'Nest error msg';
	// 		const description = 'Nest error description';
	// 		const nestError = new NotFoundException(errorMsg, description);
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
	// 		const expected: ErrorResponse = new ErrorResponse('NOT_FOUND', 'Not Found', errorMsg, HttpStatus.NOT_FOUND);
	// 		expect(result).toStrictEqual(expected);
	// 	});

	// 	it('should process a nest error with data object correctly', () => {
	// 		const errorObj = { msg: 'Nest error msg' };
	// 		const nestError = new NotFoundException(errorObj);
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
	// 		const expected: ErrorResponse = new ErrorResponse(
	// 			'NOT_FOUND',
	// 			'Not Found',
	// 			'Not Found Exception',
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 		expect(result).toStrictEqual(expected);
	// 	});

	// 	it('should process a nest error with data object and description correctly', () => {
	// 		const errorObj = { msg: 'Nest error msg' };
	// 		const description = 'Nest error description';
	// 		const nestError = new NotFoundException(errorObj, description);
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(nestError);
	// 		const expected: ErrorResponse = new ErrorResponse(
	// 			'NOT_FOUND',
	// 			'Not Found',
	// 			'Not Found Exception',
	// 			HttpStatus.NOT_FOUND
	// 		);
	// 		expect(result).toStrictEqual(expected);
	// 	});

	// 	it('should not publish (error details) for default errors with custom message', () => {
	// 		const errorMsg = 'technical details message';
	// 		const unknownError = new Error(errorMsg);
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(unknownError);
	// 		const expected: ErrorResponse = new ErrorResponse(
	// 			'INTERNAL_SERVER_ERROR',
	// 			'Internal Server Error',
	// 			'Internal Server Error',
	// 			HttpStatus.INTERNAL_SERVER_ERROR
	// 		);
	// 		expect(result).toStrictEqual(expected);
	// 		expect(result.message).toEqual('Internal Server Error');
	// 		expect(result.message).not.toEqual(errorMsg);
	// 	});

	// 	it('should not publish (error details) for default errors with default message', () => {
	// 		const unknownError = new Error();
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(unknownError);
	// 		const expected: ErrorResponse = new ErrorResponse(
	// 			'INTERNAL_SERVER_ERROR',
	// 			'Internal Server Error',
	// 			'Internal Server Error',
	// 			HttpStatus.INTERNAL_SERVER_ERROR
	// 		);
	// 		expect(result).toStrictEqual(expected);
	// 		expect(result.message).toEqual('Internal Server Error');
	// 	});

	// 	it('should process error response correctly in case of processing failure', () => {
	// 		class ShouldFailError extends SampleError {
	// 			getResponse(): ErrorResponse {
	// 				throw new Error('Should fail');
	// 			}
	// 		}
	// 		const shouldFailError = new ShouldFailError('');
	// 		const result: ErrorResponse = errorFilter.createErrorResponse(shouldFailError);
	// 		const expected: ErrorResponse = new ErrorResponse(
	// 			'INTERNAL_SERVER_ERROR',
	// 			'Internal Server Error',
	// 			'Internal Server Error',
	// 			HttpStatus.INTERNAL_SERVER_ERROR
	// 		);
	// 		expect(result).toStrictEqual(expected);
	// 	});
	// });

	// describe('catch', () => {
	// 	describe('should call logger.error', () => {
	// 		const context = createMock<ArgumentsHost>();
	// 		it('should process a feathers error correctly', () => {
	// 			const feathersError = new NotFound('Not found message');
	// 			// eslint-disable-next-line promise/valid-params
	// 			errorFilter.catch(feathersError, context);
	// 			expect(logger.error).toBeCalledWith(feathersError, expect.any(String), 'Feathers Error');
	// 		});

	// 		it('should process a business error correctly', () => {
	// 			const errorMsg = 'Business error msg';
	// 			const businessError = new SampleError(errorMsg);
	// 			// eslint-disable-next-line promise/valid-params
	// 			errorFilter.catch(businessError, context);

	// 			expect(logger.error).toBeCalledWith(businessError, expect.any(String), 'Business Error');
	// 		});

	// 		it('should process a nest error without parameters correctly', () => {
	// 			const nestError = new NotFoundException();
	// 			// eslint-disable-next-line promise/valid-params
	// 			errorFilter.catch(nestError, context);
	// 			expect(logger.error).toBeCalledWith(nestError, expect.any(String), 'Technical Error');
	// 		});

	// 		it('should process a generic error without parameters correctly', () => {
	// 			const error = new Error();
	// 			// eslint-disable-next-line promise/valid-params
	// 			errorFilter.catch(error, context);
	// 			expect(logger.error).toBeCalledWith(error, expect.any(String), 'Unhandled Error');
	// 		});

	// 		it('should process an unknown error without parameters correctly', () => {
	// 			const error = { msg: 'Unknown error' };
	// 			// eslint-disable-next-line promise/valid-params
	// 			errorFilter.catch(error, context);
	// 			expect(logger.error).toBeCalledWith(error, 'Unknown error');
	// 		});
	// 	});

	// 	describe('when context type === http', () => {
	// 		const context = createMock<ArgumentsHost>();
	// 		context.getType.mockReturnValue('http');
	// 		const error = new SampleError();

	// 		it('should call switchToHttp()', () => {
	// 			// eslint-disable-next-line promise/valid-params
	// 			errorFilter.catch(error, context);
	// 			expect(context.switchToHttp).toBeCalled();
	// 		});

	// 		it('should call context.switchToHttp().getResponse()', () => {
	// 			// eslint-disable-next-line promise/valid-params
	// 			errorFilter.catch(error, context);
	// 			expect(context.switchToHttp().getResponse).toBeCalled();
	// 		});
	// 	});

	// 	describe('when context type === rmq', () => {
	// 		const context = createMock<ArgumentsHost>();
	// 		context.getType.mockReturnValue('rmq');

	// 		it('should process a feathers error correctly', () => {
	// 			const error = new NotFound('Not found message');
	// 			// eslint-disable-next-line promise/valid-params
	// 			const result = errorFilter.catch(error, context);
	// 			expect(result).toStrictEqual({ message: undefined, error });
	// 		});
	// 	});
	// });
});
