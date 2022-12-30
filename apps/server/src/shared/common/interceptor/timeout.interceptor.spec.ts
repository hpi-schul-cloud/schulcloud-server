import { Controller, Get, HttpStatus, INestApplication, NestInterceptor } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestTimeout, TimeoutInterceptor } from '@shared/common';
import request from 'supertest';

// eslint-disable-next-line no-promise-executor-return
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Controller()
class DelayController {
	/** default route to test public access */
	@Get()
	async getHello(): Promise<string> {
		await delay(100);
		return 'Schulcloud Server API';
	}

	@RequestTimeout(1)
	@Get('/timeout')
	async getHelloWithTimeout(): Promise<string> {
		await delay(100);
		return 'Schulcloud Server API';
	}
}

export const createTestModule = (interceptor: NestInterceptor): Promise<TestingModule> =>
	Test.createTestingModule({
		providers: [
			{
				provide: APP_INTERCEPTOR,
				useValue: interceptor,
			},
		],
		controllers: [DelayController],
	}).compile();

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
