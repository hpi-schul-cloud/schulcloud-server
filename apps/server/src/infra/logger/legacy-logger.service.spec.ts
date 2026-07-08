/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { type Logger as WinstonLogger } from 'winston';
import { LegacyLogger } from './legacy-logger.service';

describe('LegacyLogger', () => {
	let service: LegacyLogger;
	let processStdoutWriteSpy;
	let processStderrWriteSpy;
	let winstonLogger: DeepMocked<WinstonLogger>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LegacyLogger,
				{
					provide: WINSTON_MODULE_PROVIDER,
					useValue: createMock<WinstonLogger>(),
				},
			],
		}).compile();

		service = await module.resolve(LegacyLogger);
		winstonLogger = module.get(WINSTON_MODULE_PROVIDER);
	});

	beforeEach(() => {
		processStdoutWriteSpy = jest.spyOn(process.stdout, 'write');
		processStderrWriteSpy = jest.spyOn(process.stderr, 'write');
	});

	afterEach(() => {
		processStdoutWriteSpy.mockRestore();
		processStderrWriteSpy.mockRestore();
	});

	describe('WHEN error logging', () => {
		it('should call winstonLogger.error', () => {
			const error = new Error('custom error');
			service.error(error.message, error.stack);
			expect(winstonLogger.error).toHaveBeenCalled();
		});

		it('should work also when providing circular references', () => {
			const a: { name: string; b?: object | undefined } = { name: 'great' };
			const b = { a };
			a.b = b;
			service.error(a);
			expect(winstonLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringMatching(/name.*great/) as string,
				})
			);
		});
	});

	describe('WHEN warn logging', () => {
		it('should call winstonLogger.warning', () => {
			const error = new Error('custom error');
			service.warn(error.message, error.stack);
			expect(winstonLogger.warning).toHaveBeenCalled();
		});
	});

	describe('WHEN debug logging', () => {
		it('should call winstonLogger.debug', () => {
			const error = new Error('custom error');
			service.debug(error.message, error.stack);
			expect(winstonLogger.debug).toHaveBeenCalled();
		});
	});

	describe('WHEN http logging', () => {
		it('should call winstonLogger.notice', () => {
			const error = new Error('custom error');
			service.http({
				userId: '123',
				request: { method: 'GET', url: '/test', params: {}, query: {} },
				error,
			});
			expect(winstonLogger.notice).toHaveBeenCalled();
		});
	});

	describe('WHEN log logging', () => {
		it('should call winstonLogger.info', () => {
			const error = new Error('custom error');
			service.log(error.message);
			expect(winstonLogger.info).toHaveBeenCalled();
		});
	});
});
