import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { WinstonLogger, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Loggable } from './interfaces';
import { Logger } from './logger';
import { LogMessage, ErrorLogMessage, ValidationErrorLogMessage } from './types';

class SampleLoggable implements Loggable {
	getLogMessage(): LogMessage | ErrorLogMessage | ValidationErrorLogMessage {
		const message = {
			message: 'test',
			data: 'data',
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

		service = module.get(Logger);
		winstonLogger = module.get(WINSTON_MODULE_PROVIDER);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('warn', () => {
		it('should call warn method of WinstonLogger with appropriate message', () => {
			const loggable = new SampleLoggable();

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const expectedMessage = expect.objectContaining({ message: "{ message: 'test', data: 'data' }" });

			service.warn(loggable);

			expect(winstonLogger.warn).toBeCalledWith(expectedMessage);
		});
	});
});
