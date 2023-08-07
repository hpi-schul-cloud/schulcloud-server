import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { Loggable } from './interfaces';
import { Logger } from './logger';
import { ErrorLogMessage, LogMessage, ValidationErrorLogMessage } from './types';

class SampleLoggable implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message = {
			message: 'test message',
			data: 'test data',
		};

		return message;
	}
}

describe('Logger', () => {
	let module: TestingModule;
	let service: Logger;
	let winstonLogger: DeepMocked<WinstonLogger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				Logger,
				{
					provide: WINSTON_MODULE_PROVIDER,
					useValue: createMock<WinstonLogger>(),
				},
			],
		}).compile();

		service = await module.resolve(Logger);
		winstonLogger = await module.get(WINSTON_MODULE_PROVIDER);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('info', () => {
		it('should call info method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();
			service.setContext('test context');

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.info(loggable);

			expect(winstonLogger.info).toBeCalledWith(expectedMessage);
		});
	});

	describe('warn', () => {
		it('should call warn method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();
			service.setContext('test context');

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.warning(loggable);

			expect(winstonLogger.warning).toBeCalledWith(expectedMessage);
		});
	});

	describe('debug', () => {
		it('should call debug method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();
			service.setContext('test context');

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.debug(loggable);

			expect(winstonLogger.debug).toBeCalledWith(expectedMessage);
		});
	});

	describe('setContext', () => {
		it('should set the context', () => {
			service.setContext('test');

			// eslint-disable-next-line @typescript-eslint/dot-notation
			expect(service['context']).toEqual('test');
		});
	});

	describe('notice', () => {
		it('should call notice method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();
			service.setContext('test context');

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.notice(loggable);

			expect(winstonLogger.notice).toBeCalledWith(expectedMessage);
		});
	});
});
