import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { Test } from '@nestjs/testing';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DurationLoggingInterceptor } from './duration-logging.interceptor';
import { TestApiClient } from '../../testing';

@Controller()
class TestController {
	@Get()
	test(): { message: string } {
		return { message: 'MyMessage' };
	}
}

describe('DurationLoggingInterceptor', () => {
	describe('when integrate DurationLoggingInterceptor', () => {
		let app: INestApplication;
		let logger: DeepMocked<LegacyLogger> = createMock<LegacyLogger>();
		let testApiClient: TestApiClient;

		beforeAll(async () => {
			const moduleFixture = await Test.createTestingModule({
				providers: [
					{
						provide: LegacyLogger,
						useValue: createMock<LegacyLogger>(),
					},
					{
						provide: APP_INTERCEPTOR,
						useFactory: (legacyLogger: LegacyLogger) => new DurationLoggingInterceptor(legacyLogger),
						inject: [LegacyLogger],
					},
				],
				controllers: [TestController],
			}).compile();

			app = moduleFixture.createNestApplication();
			await app.init();

			logger = app.get(LegacyLogger);
			testApiClient = new TestApiClient(app, '');
		});

		afterAll(async () => {
			await app.close();
		});

		it(`should not transform the response and produce before- and after-log`, async () => {
			const response = await testApiClient.get();

			expect(response.status).toBe(HttpStatus.OK);
			expect(response.body).toEqual({ message: 'MyMessage' });
			expect(logger.log).toBeCalledTimes(2);
		});
	});
});
