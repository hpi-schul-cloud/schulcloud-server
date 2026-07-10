import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Loggable, type LoggableMessage } from '@shared/common/loggable';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { type Logger as WinstonLogger } from 'winston';
import { Logger } from './logger';

class SampleLoggable implements Loggable {
	getLogMessage(): LoggableMessage {
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

			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.info(loggable);

			expect(winstonLogger.info).toHaveBeenCalledWith(expectedMessage);
		});
	});

	describe('warn', () => {
		it('should call warn method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();
			service.setContext('test context');

			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.warning(loggable);

			expect(winstonLogger.warning).toHaveBeenCalledWith(expectedMessage);
		});
	});

	describe('debug', () => {
		it('should call debug method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();
			service.setContext('test context');

			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.debug(loggable);

			expect(winstonLogger.debug).toHaveBeenCalledWith(expectedMessage);
		});
	});

	describe('setContext', () => {
		it('should set the context', () => {
			service.setContext('test');

			expect(service['context']).toEqual('test');
		});
	});

	describe('notice', () => {
		it('should call notice method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();
			service.setContext('test context');

			const expectedMessage = expect.objectContaining({
				message: "{ message: 'test message', data: 'test data' }",
				context: 'test context',
			});

			service.notice(loggable);

			expect(winstonLogger.notice).toHaveBeenCalledWith(expectedMessage);
		});
	});
});
