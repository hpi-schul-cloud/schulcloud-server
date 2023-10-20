/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
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
			expect(winstonLogger.error).toBeCalled();
		});

		it('should work also when providing circular references', () => {
			const a: { name: string; b?: object | undefined } = { name: 'great' };
			const b = { a };
			a.b = b;
			service.error(a);
			expect(winstonLogger.error).toBeCalledWith(
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
			expect(winstonLogger.warning).toBeCalled();
		});
	});

	describe('WHEN debug logging', () => {
		it('should call winstonLogger.debug', () => {
			const error = new Error('custom error');
			service.debug(error.message, error.stack);
			expect(winstonLogger.debug).toBeCalled();
		});
	});

	describe('WHEN verbose logging', () => {
		it('should call winstonLogger.verbose', () => {
			const error = new Error('custom error');
			service.verbose(error.message, error.stack);
			expect(winstonLogger.verbose).toBeCalled();
		});
	});
});
