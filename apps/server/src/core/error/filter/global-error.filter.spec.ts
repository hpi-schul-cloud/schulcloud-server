/* eslint-disable promise/valid-params */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BusinessError } from '@shared/common';
import { ErrorLogger, ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import { Response } from 'express';
import { ErrorResponse } from '../dto';
import { ErrorLoggable } from '../error.loggable';
import { GlobalErrorFilter } from './global-error.filter';

class SampleBusinessError extends BusinessError {
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

class SampleLoggableException extends BadRequestException implements Loggable {
	constructor(private testData: string) {
		super();
	}

	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message = {
			type: 'BAD_REQUEST_EXCEPTION',
			stack: this.stack,
			data: {
				testData: this.testData,
			},
		};

		return message;
	}
}

// TODO: Write tests
describe('GlobalErrorFilter', () => {
	let module: TestingModule;
	let service: GlobalErrorFilter<any>;
	let logger: DeepMocked<ErrorLogger>;

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

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('catch', () => {
		describe('logging', () => {
			it('should call logger with error if error implements Loggable', () => {
				const error = new SampleLoggableException('test');
				const argumentsHost = createMock<ArgumentsHost>();

				service.catch(error, argumentsHost);

				expect(logger.error).toBeCalledWith(error);
			});

			it('should call logger with ErrorLoggable for generic error', () => {
				const error = new Error('test');
				const loggable = new ErrorLoggable(error);
				const argumentsHost = createMock<ArgumentsHost>();

				service.catch(error, argumentsHost);

				expect(logger.error).toBeCalledWith(loggable);
			});
		});

		describe('response', () => {
			describe('when context is http', () => {
				const setupHttpArgumentsHost = () => {
					const argumentsHost = createMock<ArgumentsHost>();
					argumentsHost.getType.mockReturnValueOnce('http');

					return argumentsHost;
				};

				describe('when error is an HTTP exception', () => {
					const setup = () => {
						const argumentsHost = setupHttpArgumentsHost();
						const error = new BadRequestException();
						const expectedResponse = new ErrorResponse(
							'BAD_REQUEST',
							'Bad Request',
							'Bad Request',
							HttpStatus.BAD_REQUEST
						);

						return { error, argumentsHost, expectedResponse };
					};

					it('should set response status appropriately', () => {
						const { error, argumentsHost } = setup();

						service.catch(error, argumentsHost);

						expect(argumentsHost.switchToHttp().getResponse<Response>().status).toBeCalledWith(HttpStatus.BAD_REQUEST);
					});

					it('should send appropriate error response', () => {
						const { error, argumentsHost, expectedResponse } = setup();

						service.catch(error, argumentsHost);

						expect(
							argumentsHost.switchToHttp().getResponse<Response>().status(HttpStatus.BAD_REQUEST).json
						).toBeCalledWith(expectedResponse);
					});
				});

				describe('when error is a generic error', () => {
					const setup = () => {
						const argumentsHost = setupHttpArgumentsHost();
						const error = new Error();
						const expectedResponse = new ErrorResponse(
							'INTERNAL_SERVER_ERROR',
							'Internal Server Error',
							'Internal Server Error',
							HttpStatus.INTERNAL_SERVER_ERROR
						);

						return { error, argumentsHost, expectedResponse };
					};

					it('should set response status appropriately', () => {
						const { error, argumentsHost } = setup();

						service.catch(error, argumentsHost);

						expect(argumentsHost.switchToHttp().getResponse<Response>().status).toBeCalledWith(
							HttpStatus.INTERNAL_SERVER_ERROR
						);
					});

					it('should send appropriate error response', () => {
						const { error, argumentsHost, expectedResponse } = setup();

						service.catch(error, argumentsHost);

						expect(
							argumentsHost.switchToHttp().getResponse<Response>().status(HttpStatus.INTERNAL_SERVER_ERROR).json
						).toBeCalledWith(expectedResponse);
					});
				});

				it('should send JSON response', () => {
					const argumentsHost = setupHttpArgumentsHost();
					const error = new Error();

					service.catch(error, argumentsHost);

					expect(
						argumentsHost.switchToHttp().getResponse<Response>().status(HttpStatus.INTERNAL_SERVER_ERROR).json
					).toBeCalled();
				});
			});

			describe('when context is rmq', () => {
				const setup = () => {
					const argumentsHost = createMock<ArgumentsHost>();
					argumentsHost.getType.mockReturnValueOnce('rmq');

					const error = new Error();

					return { error, argumentsHost };
				};

				it('should return an RpcMessage with the error', () => {
					const { error, argumentsHost } = setup();

					const result = service.catch(error, argumentsHost);

					expect(result).toEqual({ message: undefined, error });
				});
			});
		});
	});
});
