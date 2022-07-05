/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from './logger.service';

describe('Logger', () => {
	let service: Logger;
	let processStdoutWriteSpy;
	let processStderrWriteSpy;
	const msg = {
		request: { url: '/', method: 'POST', params: {}, query: {} },
		error: undefined,
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				Logger,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = await module.resolve(Logger);
	});

	beforeEach(() => {
		processStdoutWriteSpy = jest.spyOn(process.stdout, 'write');
		processStderrWriteSpy = jest.spyOn(process.stderr, 'write');
	});

	afterEach(() => {
		processStdoutWriteSpy.mockRestore();
		processStderrWriteSpy.mockRestore();
	});

	describe('http requests logging', () => {
		it('should call to stdout', () => {
			service.http(msg);

			expect(processStdoutWriteSpy).toBeCalled();
		});

		it('should write to stdout', () => {
			service.http(msg);
			expect(processStdoutWriteSpy).toBeCalledWith(expect.stringMatching(/HTTP REQUEST/));
		});
		it('should write to stdout with CUSTOM_CONTEXT', () => {
			service.http(msg, 'CUSTOM_CONTEXT');
			expect(processStdoutWriteSpy).toBeCalledWith(expect.stringMatching(/CUSTOM_CONTEXT/));
		});
	});
});
