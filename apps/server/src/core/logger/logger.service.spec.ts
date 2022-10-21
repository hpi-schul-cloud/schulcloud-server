/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { Logger } from './logger.service';

describe('Logger', () => {
	let service: Logger;
	let winstonLogger: DeepMocked<WinstonLogger>;
	const msg = {
		request: { url: '/', method: 'POST', params: {}, query: {} },
		error: undefined,
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				Logger,
				{
					provide: WINSTON_MODULE_PROVIDER,
					useValue: createMock<WinstonLogger>(),
				},
			],
		}).compile();

		service = await module.resolve(Logger);
		winstonLogger = module.get(WINSTON_MODULE_PROVIDER);
	});

	describe('WHEN http requests logging', () => {
		it('should call winstonLogger.http', () => {
			service.http(msg);

			expect(winstonLogger.http).toBeCalled();
		});

		it('should call winstonLogger.http with params', () => {
			service.http(msg, 'HTTP TEST');
			const expectedParams = {
				context: 'HTTP TEST',
				message: "{  request: { url: '/', method: 'POST', params: {}, query: {} },  error: undefined}",
			};
			expect(winstonLogger.http).toBeCalledWith(expectedParams);
		});
	});

	describe('WHEN error logging', () => {
		it('should call winstonLogger.error', () => {
			const error = new Error('custom error');
			service.error(error.message, error.stack);
			expect(winstonLogger.error).toBeCalled();
		});
	});
});
