/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TimeoutInterceptor } from '@shared/common';
import { createTestModule } from './test/create-test.module';

describe('TimeoutInterceptor', () => {
	describe('when integrate TimeoutInterceptor', () => {
		let app: INestApplication;

		it(`should timeout with small timeout value`, async () => {
			const interceptor = new TimeoutInterceptor();
			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			// await normal response, see default REQUEST_TIMEOUT
			await request(app.getHttpServer()).get('/').expect(200).expect('Schulcloud Server API');

			interceptor.timeout = 11;
			await request(app.getHttpServer()).get('/').expect(HttpStatus.REQUEST_TIMEOUT);

			await app.close();
		});
	});
});
