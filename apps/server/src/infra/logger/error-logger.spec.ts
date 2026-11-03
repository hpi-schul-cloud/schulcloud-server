import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ErrorLoggable } from '@infra/error';
import { Injectable, Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { type Logger as WinstonLogger } from 'winston';
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

		service = await module.resolve(ErrorLogger);
		winstonLogger = module.get(WINSTON_MODULE_PROVIDER);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('context', () => {
		@Injectable()
		class SampleErrorHandler {
			constructor(public readonly logger: ErrorLogger) {}
		}

		@Module({
			providers: [
				SampleErrorHandler,
				ErrorLogger,
				{ provide: WINSTON_MODULE_PROVIDER, useFactory: () => winstonLogger },
			],
		})
		class SampleErrorModule {}

		it('should add the class and module using the logger as context and module', async () => {
			const testModule = await Test.createTestingModule({ imports: [SampleErrorModule] }).compile();
			const handler = testModule.get(SampleErrorHandler);

			handler.logger.error(new ErrorLoggable(new Error('test')));

			expect(winstonLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({ context: 'SampleErrorHandler', module: 'SampleErrorModule' })
			);
			await testModule.close();
		});
	});

	describe('emerg', () => {
		it('should call emerg method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({
				message: 'test',
				error: expect.objectContaining({ name: 'Error', message: 'test' }),
			});

			service.emerg(loggable);

			expect(winstonLogger.emerg).toHaveBeenCalledWith(expectedMessage);
		});
	});

	describe('alert', () => {
		it('should call alert method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({
				message: 'test',
				error: expect.objectContaining({ name: 'Error', message: 'test' }),
			});

			service.alert(loggable);

			expect(winstonLogger.alert).toHaveBeenCalledWith(expectedMessage);
		});
	});

	describe('crit', () => {
		it('should call crit method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({
				message: 'test',
				error: expect.objectContaining({ name: 'Error', message: 'test' }),
			});

			service.crit(loggable);

			expect(winstonLogger.crit).toHaveBeenCalledWith(expectedMessage);
		});
	});

	describe('error', () => {
		it('should call error method of WinstonLogger with appropriate message', () => {
			const error = new Error('test');
			const loggable = new ErrorLoggable(error);

			const expectedMessage = expect.objectContaining({
				message: 'test',
				error: expect.objectContaining({ name: 'Error', message: 'test' }),
			});

			service.error(loggable);

			expect(winstonLogger.error).toHaveBeenCalledWith(expectedMessage);
		});
	});
});
