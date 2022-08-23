import { HttpStatus, INestApplication } from '@nestjs/common';
import { TimeoutInterceptor } from '@shared/common';
import request from 'supertest';
import { createTestModule } from './test/create-test.module';

describe('TimeoutInterceptor', () => {
	describe('when integrate TimeoutInterceptor', () => {
		let app: INestApplication;

		beforeEach(async () => {});

		afterEach(async () => {
			await app.close();
		});

		it('should respond with error code if request runs into timeout', async () => {
			const interceptor = new TimeoutInterceptor(1);

			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			const response = await request(app.getHttpServer()).get('/');

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
		});

		it('should pass if request does not run into timeout', async () => {
			const interceptor = new TimeoutInterceptor(30000);

			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			const response = await request(app.getHttpServer()).get('/');

			expect(response.status).toEqual(HttpStatus.OK);
		});

		it('should respond with error code if request runs into timeout by timeout decorator', async () => {
			const interceptor = new TimeoutInterceptor(30000);

			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			const response = await request(app.getHttpServer()).get('/timeout');

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
		});
	});
});
