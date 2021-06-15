/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, NestInterceptor } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_INTERCEPTOR } from '@nestjs/core';
import * as request from 'supertest';
import { ServerModule } from '@src/server.module';
import { DurationLoggingInterceptor } from '@src/shared/interceptor/index';
import { Logger } from '@src/core/logger/logger.service';

describe('DurationLoggingInterceptor', () => {
	describe('when integrate DurationLoggingInterceptor', () => {
		function createTestModule(interceptor: NestInterceptor) {
			return Test.createTestingModule({
				imports: [ServerModule],
				providers: [
					{
						provide: APP_INTERCEPTOR,
						useValue: interceptor,
					},
				],
			}).compile();
		}
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
			await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');

			expect(loggerSpy).toBeCalledTimes(2);

			await app.close();
		});
	});
});
