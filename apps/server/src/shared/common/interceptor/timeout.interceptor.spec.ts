/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';

import { TimeoutInterceptor } from '@shared/common';

import { createTestModule } from './test/create-test.module';
import { IInterceptorConfig } from './interfaces';

describe('TimeoutInterceptor', () => {
	describe('when integrate TimeoutInterceptor', () => {
		let app: INestApplication;

		it(`should throw if timeout is arrived`, async () => {
			const configService = new ConfigService<IInterceptorConfig>({ INCOMING_REQUEST_TIMEOUT: 1 });
			const interceptor = new TimeoutInterceptor(configService);

			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			await request(app.getHttpServer()).get('/').expect(HttpStatus.REQUEST_TIMEOUT);

			await app.close();
		});

		it('should pass if no timeout is arrived`', async () => {
			const configService = new ConfigService<IInterceptorConfig>({ INCOMING_REQUEST_TIMEOUT: 30000 });
			const interceptor = new TimeoutInterceptor(configService);

			app = (await createTestModule(interceptor)).createNestApplication();
			await app.init();

			await request(app.getHttpServer()).get('/').expect(200).expect('Schulcloud Server API');

			await app.close();
		});
	});
});
