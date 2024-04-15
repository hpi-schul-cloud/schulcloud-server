/* eslint-disable promise/valid-params */
import { NotFound } from '@feathersjs/errors';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ArgumentsHost, BadRequestException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BusinessError } from '@shared/common';
import { ErrorLogMessage, Loggable } from '@src/core/logger';
import { Response } from 'express';
import { ErrorResponse } from '../dto';
import { ErrorUtils } from '../utils';
import { GlobalErrorFilter } from './global-error.filter';
import { DomainErrorHandler } from '../domain';
import { WsException } from '@nestjs/websockets';

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

class SampleLoggableExceptionWithCause extends InternalServerErrorException implements Loggable {
	constructor(private readonly testValue: string, error?: unknown) {
		super(ErrorUtils.createHttpExceptionOptions(error));
	}

	getLogMessage(): ErrorLogMessage {
		const message: ErrorLogMessage = {
			type: 'WITH_CAUSE',
			stack: this.stack,
			data: {
				testValue: this.testValue,
			},
		};

		return message;
	}
}

describe('GlobalErrorFilter', () => {
	let module: TestingModule;
	let service: GlobalErrorFilter<any>;
	let domainErrorHandler: DeepMocked<DomainErrorHandler>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				GlobalErrorFilter,
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
			],
		}).compile();

		service = module.get(GlobalErrorFilter);
		domainErrorHandler = module.get(DomainErrorHandler);
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
		describe('when any error is passed as parameter', () => {
			const setup = () => {
				const argumentsHost = createMock<ArgumentsHost>();
				argumentsHost.getType.mockReturnValueOnce('http');
				const error = new Error('test');

				return { error, argumentsHost };
			};

			it('should be pass the error to domain error handler', () => {
				const { error, argumentsHost } = setup();

				service.catch(error, argumentsHost);

				expect(domainErrorHandler.exec).toBeCalledWith(error);
			});
		});

		describe('given context is http', () => {
			const mockHttpArgumentsHost = () => {
				const argumentsHost = createMock<ArgumentsHost>();
				argumentsHost.getType.mockReturnValueOnce('http');

				return argumentsHost;
			};

			describe('when error is a FeathersError', () => {
				const setup = () => {
					const argumentsHost = mockHttpArgumentsHost();
					const error = new NotFound();
					const expectedResponse = new ErrorResponse('NOT_FOUND', 'Not Found', 'Error', HttpStatus.NOT_FOUND);

					return { error, argumentsHost, expectedResponse };
				};

				it('should set response status appropriately', () => {
					const { error, argumentsHost } = setup();

					service.catch(error, argumentsHost);

					expect(argumentsHost.switchToHttp().getResponse<Response>().status).toBeCalledWith(HttpStatus.NOT_FOUND);
				});

				it('should send appropriate error response', () => {
					const { error, argumentsHost, expectedResponse } = setup();

					service.catch(error, argumentsHost);

					expect(
						argumentsHost.switchToHttp().getResponse<Response>().status(HttpStatus.NOT_IMPLEMENTED).json
					).toBeCalledWith(expectedResponse);
				});
			});

			describe('when error is a BusinessError', () => {
				const setup = () => {
					const argumentsHost = mockHttpArgumentsHost();
					const error = new SampleBusinessError();
					const expectedResponse = new ErrorResponse(
						'SAMPLE_ERROR',
						'Sample Error',
						'sample error message',
						HttpStatus.NOT_IMPLEMENTED
					);

					return { error, argumentsHost, expectedResponse };
				};

				it('should set response status appropriately', () => {
					const { error, argumentsHost } = setup();

					service.catch(error, argumentsHost);

					expect(argumentsHost.switchToHttp().getResponse<Response>().status).toBeCalledWith(
						HttpStatus.NOT_IMPLEMENTED
					);
				});

				it('should send appropriate error response', () => {
					const { error, argumentsHost, expectedResponse } = setup();

					service.catch(error, argumentsHost);

					expect(
						argumentsHost.switchToHttp().getResponse<Response>().status(HttpStatus.NOT_IMPLEMENTED).json
					).toBeCalledWith(expectedResponse);
				});
			});

			describe('when error is a NestHttpException', () => {
				const setup = () => {
					const argumentsHost = mockHttpArgumentsHost();
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
					const argumentsHost = mockHttpArgumentsHost();
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

			describe('when error is some random object', () => {
				const setup = () => {
					const argumentsHost = mockHttpArgumentsHost();
					const error = { foo: 'bar' };
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

			describe('when error has a cause error', () => {
				const setup = () => {
					const causeError = new Error('Cause error');
					const error = new SampleLoggableExceptionWithCause('test', causeError);
					const expectedResponse = new ErrorResponse(
						'SAMPLE_WITH_CAUSE',
						'Sample With Cause',
						'Sample Loggable Exception With Cause',
						HttpStatus.INTERNAL_SERVER_ERROR
					);

					const argumentsHost = mockHttpArgumentsHost();

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
		});

		describe('given context is rmq', () => {
			const mockRmqArgumentHost = () => {
				const argumentsHost = createMock<ArgumentsHost>();
				argumentsHost.getType.mockReturnValueOnce('rmq');

				return argumentsHost;
			};

			describe('when error is unknown error', () => {
				const setup = () => {
					const argumentsHost = mockRmqArgumentHost();
					const error = new Error();

					return { error, argumentsHost };
				};

				it('should return an RpcMessage with the error', () => {
					const { error, argumentsHost } = setup();

					const result = service.catch(error, argumentsHost);

					expect(result).toEqual({ message: undefined, error });
				});
			});

			describe('when error is a LoggableError', () => {
				const setup = () => {
					const argumentsHost = mockRmqArgumentHost();
					const causeError = new Error('Cause error');
					const error = new SampleLoggableExceptionWithCause('test', causeError);

					return { error, argumentsHost };
				};

				it('should return appropriate error', () => {
					const { error, argumentsHost } = setup();

					const result = service.catch(error, argumentsHost);

					expect(result).toEqual({ message: undefined, error });
				});
			});
		});

		describe('given context is ws', () => {
			const mockRmqArgumentHost = () => {
				const argumentsHost = createMock<ArgumentsHost>();
				argumentsHost.getType.mockReturnValueOnce('ws');

				return argumentsHost;
			};

			describe('when error is unknown error', () => {
				const setup = () => {
					const argumentsHost = mockRmqArgumentHost();
					const error = new Error('test');

					return { error, argumentsHost };
				};

				it('should return an RpcMessage with the error', () => {
					const { error, argumentsHost } = setup();

					const result = service.catch(error, argumentsHost);

					expect(result).toEqual(new WsException(error));
				});
			});

			describe('when error is a LoggableError', () => {
				const setup = () => {
					const argumentsHost = mockRmqArgumentHost();
					const causeError = new Error('Cause error');
					const error = new SampleLoggableExceptionWithCause('test', causeError);

					return { error, argumentsHost };
				};

				it('should return appropriate error', () => {
					const { error, argumentsHost } = setup();

					const result = service.catch(error, argumentsHost);

					expect(result).toEqual(new WsException(error));
				});
			});
		});

		describe('given context is rpc', () => {
			const mockRpcArgumentHost = () => {
				const argumentsHost = createMock<ArgumentsHost>();
				argumentsHost.getType.mockReturnValueOnce('rpc');

				return argumentsHost;
			};

			describe('when error is unknown error', () => {
				const setup = () => {
					const argumentsHost = mockRpcArgumentHost();
					const error = new Error();

					return { error, argumentsHost };
				};

				it('should return an RpcMessage with the error', () => {
					const { error, argumentsHost } = setup();

					const result = service.catch(error, argumentsHost);

					expect(result).toEqual({ message: undefined, error });
				});
			});

			describe('when error is a LoggableError', () => {
				const setup = () => {
					const argumentsHost = mockRpcArgumentHost();
					const causeError = new Error('Cause error');
					const error = new SampleLoggableExceptionWithCause('test', causeError);

					return { error, argumentsHost };
				};

				it('should return appropriate error', () => {
					const { error, argumentsHost } = setup();

					const result = service.catch(error, argumentsHost);

					expect(result).toEqual({ message: undefined, error });
				});
			});
		});

		describe('when context is other than rmq and http', () => {
			const setup = () => {
				const argumentsHost = createMock<ArgumentsHost>();
				argumentsHost.getType.mockReturnValueOnce('other');

				const error = new Error();

				return { error, argumentsHost };
			};

			it('should return undefined', () => {
				const { error, argumentsHost } = setup();

				const result = service.catch(error, argumentsHost);

				expect(result).toBeUndefined();
			});
		});
	});
});
