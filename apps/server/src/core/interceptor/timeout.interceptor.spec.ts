import { Controller, Get, HttpStatus } from '@nestjs/common';
import { APP_INTERCEPTOR, ModuleRef } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RequestTimeout } from '@shared/common/decorators';
import { TestApiClient } from '@testing/test-api-client';
import { DEFAULT_TIMEOUT_CONFIG_TOKEN, DefaultTimeoutConfig } from './default-timeout.config';
import { TimeoutInterceptor } from './timeout.interceptor';

const delay = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const CUSTOM_TIMEOUT_CONFIG_KEY = 'MY_CONFIG_NAME';

@Controller()
class TestController {
	@Get()
	async testDefault(): Promise<{ message: string }> {
		await delay(100);

		return { message: 'MyMessage' };
	}

	@Get('overriden')
	@RequestTimeout(CUSTOM_TIMEOUT_CONFIG_KEY)
	async testOverriden(): Promise<{ message: string }> {
		await delay(100);

		return { message: 'MyMessage' };
	}

	@Get('undefined-key')
	@RequestTimeout('UNDEFINED_CONFIG_KEY')
	async testUndefinedKey(): Promise<{ message: string }> {
		await delay(100);

		return { message: 'MyMessage' };
	}
}

describe('TimeoutInterceptor', () => {
	const createApp = async (defaultTimeoutMS: number, customTimeoutMS: number) => {
		const moduleFixture = await Test.createTestingModule({
			providers: [
				{
					provide: APP_INTERCEPTOR,
					useFactory: (config: DefaultTimeoutConfig, moduleRef: ModuleRef) => new TimeoutInterceptor(config, moduleRef),
					inject: [DEFAULT_TIMEOUT_CONFIG_TOKEN, ModuleRef],
				},
				{
					provide: DEFAULT_TIMEOUT_CONFIG_TOKEN,
					useValue: {
						incomingRequestTimeout: defaultTimeoutMS,
						[CUSTOM_TIMEOUT_CONFIG_KEY]: customTimeoutMS,
					},
				},
			],
			controllers: [TestController],
		}).compile();

		const app = moduleFixture.createNestApplication();
		await app.init();

		const testApiClient = new TestApiClient(app, '');

		return { app, testApiClient };
	};

	describe('when response is faster then the request timeout', () => {
		it('should respond with status code 200', async () => {
			const { testApiClient, app } = await createApp(1000, 500);

			const response = await testApiClient.get();

			expect(response.status).toEqual(HttpStatus.OK);
			expect(response.body).toEqual({ message: 'MyMessage' });

			await app.close();
		});
	});

	describe('when response is slower then the request timeout', () => {
		it('should respond with status request timeout', async () => {
			const { testApiClient, app } = await createApp(1, 500);

			const response = await testApiClient.get();

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);

			await app.close();
		});
	});

	describe('when override the default timeout ', () => {
		it('should respond with status code 200', async () => {
			const { testApiClient, app } = await createApp(1, 1000);

			const response = await testApiClient.get('overriden');

			expect(response.status).toEqual(HttpStatus.OK);
			expect(response.body).toEqual({ message: 'MyMessage' });

			await app.close();
		});
	});

	describe('when override the default timeout', () => {
		it('should respond with status request timeout', async () => {
			const { testApiClient, app } = await createApp(1000, 1);

			const response = await testApiClient.get('overriden');

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);

			await app.close();
		});
	});

	describe('when config key is not registered', () => {
		it('should throw an error during request', async () => {
			const { testApiClient, app } = await createApp(1000, 1000);

			const response = await testApiClient.get('undefined-key');

			expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);

			await app.close();
		});
	});
});
