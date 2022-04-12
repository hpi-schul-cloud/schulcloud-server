/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';

import { TimeoutInterceptor } from '@shared/common';

import { createTestModule } from './test/create-test.module';
import { IInterceptorConfig } from './interfaces';

describe('TimeoutInterceptor', () => {
	describe('when integrate TimeoutInterceptor', () => {
		let app: INestApplication;

		beforeEach(async () => {});

		afterEach(async () => {
			await app.close();
		});

		it('should respond with error code if request runs into timeout', async () => {
			const configService = new ConfigService<IInterceptorConfig, true>({ INCOMING_REQUEST_TIMEOUT: 1 });
			const interceptor = new TimeoutInterceptor(configService);

			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			const response = await request(app.getHttpServer()).get('/');

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
		});

		it('should pass if request does not run into timeout', async () => {
			const configService = new ConfigService<IInterceptorConfig, true>({ INCOMING_REQUEST_TIMEOUT: 30000 });
			const interceptor = new TimeoutInterceptor(configService);

			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			const response = await request(app.getHttpServer()).get('/');

			expect(response.status).toEqual(HttpStatus.OK);
		});
	});
});
