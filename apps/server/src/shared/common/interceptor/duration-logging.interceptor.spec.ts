import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { INestApplication } from '@nestjs/common';
import { DurationLoggingInterceptor } from '@shared/common';
import { Logger } from '@src/core/logger';
import request from 'supertest';
import { createTestModule } from './timeout.interceptor.spec';

describe('DurationLoggingInterceptor', () => {
	describe('when integrate DurationLoggingInterceptor', () => {
		let app: INestApplication;
		let interceptor: DurationLoggingInterceptor;

		const logger: DeepMocked<Logger> = createMock<Logger>();

		beforeEach(() => {
			interceptor = new DurationLoggingInterceptor(logger);
		});

		afterEach(() => {});

		it(`should not transform the response and produce before- and after-log`, async () => {
			app = (await createTestModule(interceptor)).createNestApplication();

			await app.init();
			await request(app.getHttpServer()).get('/').expect(200).expect('Schulcloud Server API');

			expect(logger.verbose).toBeCalledTimes(2);

			await app.close();
		});
	});
});
