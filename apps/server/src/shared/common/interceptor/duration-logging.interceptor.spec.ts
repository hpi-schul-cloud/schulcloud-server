import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DurationLoggingInterceptor } from '@shared/common';
import { Logger } from '@src/core/logger/logger.service';
import { createTestModule } from './test/create-test.module';

describe('DurationLoggingInterceptor', () => {
	describe('when integrate DurationLoggingInterceptor', () => {
		let app: INestApplication;
		let interceptor: DurationLoggingInterceptor;

		const loggerSpy = jest.spyOn(Logger.prototype, 'verbose');

		beforeEach(() => {
			interceptor = new DurationLoggingInterceptor();
		});

		afterEach(() => {
			loggerSpy.mockReset();
		});

		it(`should not transform the response and produce before- and after-log`, async () => {
			app = (await createTestModule(interceptor)).createNestApplication();

			await app.init();
			await request(app.getHttpServer()).get('/').expect(200).expect('Schulcloud Server API');

			expect(loggerSpy).toBeCalledTimes(2);

			await app.close();
		});
	});
});
