import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { ErrorLoggable } from '../error/loggable/error.loggable';
import { ErrorLogger } from './error-logger';

describe('ErrorLogger', () => {
	let module: TestingModule;
	let service: ErrorLogger;
	let winstonLogger: DeepMocked<WinstonLogger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ErrorLogger,
				{
					provide: WINSTON_MODULE_PROVIDER,
					useValue: createMock<WinstonLogger>(),
				},
			],
		}).compile();

		service = module.get(ErrorLogger);
		winstonLogger = module.get(WINSTON_MODULE_PROVIDER);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('emerg', () => {
		it('should call emerg method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({ message: expect.stringContaining('error: Error: test') });

			service.emerg(loggable);

			expect(winstonLogger.emerg).toBeCalledWith(expectedMessage);
		});
	});

	describe('alert', () => {
		it('should call alert method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({ message: expect.stringContaining('error: Error: test') });

			service.alert(loggable);

			expect(winstonLogger.alert).toBeCalledWith(expectedMessage);
		});
	});

	describe('crit', () => {
		it('should call crit method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({ message: expect.stringContaining('error: Error: test') });

			service.crit(loggable);

			expect(winstonLogger.crit).toBeCalledWith(expectedMessage);
		});
	});

	describe('error', () => {
		it('should call error method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({ message: expect.stringContaining('error: Error: test') });

			service.error(loggable);

			expect(winstonLogger.error).toBeCalledWith(expectedMessage);
		});
	});
});
