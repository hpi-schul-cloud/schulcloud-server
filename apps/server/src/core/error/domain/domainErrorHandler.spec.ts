import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BusinessError } from '@shared/common';
import { ErrorLogger, ErrorLogMessage, Loggable, LogMessage, ValidationErrorLogMessage } from '@src/core/logger';
import util from 'util';
import { ErrorLoggable } from '../loggable/error.loggable';
import { ErrorUtils } from '../utils';
import { DomainErrorHandler } from './domainErrorHandler';

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

class SampleLoggableFromBusinessException extends BusinessError implements Loggable {
	constructor(private readonly testValue: string) {
		super(
			{
				type: 'xyu',
				title: 'test_title',
				defaultMessage: 'test_defaultMessage',
			},
			HttpStatus.INTERNAL_SERVER_ERROR
		);
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
	let domainErrorHandler: DomainErrorHandler;
	let logger: DeepMocked<ErrorLogger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DomainErrorHandler,
				{
					provide: ErrorLogger,
					useValue: createMock<ErrorLogger>(),
				},
			],
		}).compile();

		domainErrorHandler = module.get(DomainErrorHandler);
		logger = module.get(ErrorLogger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(domainErrorHandler).toBeDefined();
	});

	describe('exec', () => {
		describe('when error implements Loggable', () => {
			const setup = () => {
				const error = new SampleLoggableException('test');

				return { error };
			};

			it('should call logger with error', () => {
				const { error } = setup();

				domainErrorHandler.exec(error);

				expect(logger.error).toBeCalledWith(error);
			});
		});

		describe('when error is a generic error', () => {
			const setup = () => {
				const error = new Error('test');
				const loggable = new ErrorLoggable(error);

				return { error, loggable };
			};

			it('should call logger with ErrorLoggable', () => {
				const { error, loggable } = setup();

				domainErrorHandler.exec(error);

				expect(logger.error).toBeCalledWith(loggable);
			});
		});

		describe('when error is some random object', () => {
			const setup = () => {
				const randomObject = { foo: 'bar' };
				const error = new Error(util.inspect(randomObject));
				const loggable = new ErrorLoggable(error);

				return { error, loggable };
			};

			it('should call logger with ErrorLoggable', () => {
				const { error, loggable } = setup();

				domainErrorHandler.exec(error);

				expect(logger.error).toBeCalledWith(loggable);
			});
		});

		describe('when error is loggable exception with cause', () => {
			const setup = () => {
				const error = new Error('test');
				const loggable = new SampleLoggableExceptionWithCause('test', error);

				return { error, loggable };
			};

			it('should call logger with ErrorLoggable', () => {
				const { loggable } = setup();

				domainErrorHandler.exec(loggable);

				expect(logger.error).toBeCalledWith(loggable);
			});
		});

		describe('when error is a business exception', () => {
			const setup = () => {
				const loggable = new SampleLoggableFromBusinessException('test');

				return { loggable };
			};

			it('should call logger with ErrorLoggable', () => {
				const { loggable } = setup();

				domainErrorHandler.exec(loggable);

				expect(logger.error).toBeCalledWith(loggable);
			});
		});
	});
});
