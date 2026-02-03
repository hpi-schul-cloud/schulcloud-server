import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RequestTimeout } from '@shared/common/decorators';
import { TestApiClient } from '@testing/test-api-client';
import { TimeoutConfig } from './timeout-interceptor-config.interface';
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
}

describe('TimeoutInterceptor', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	let config: TimeoutConfig;

	const CONFIG_TOKEN = 'TIMEOUT_CONFIG_TOKEN';

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			providers: [
				{
					provide: APP_INTERCEPTOR,
					useFactory: (config: TimeoutConfig) => new TimeoutInterceptor(config),
					inject: [CONFIG_TOKEN],
				},
				{
					provide: CONFIG_TOKEN,
					useValue: {
						[CUSTOM_TIMEOUT_CONFIG_KEY]: 500,
						incomingRequestTimeout: 200,
					},
				},
			],
			controllers: [TestController],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		testApiClient = new TestApiClient(app, '');
		config = app.get(CONFIG_TOKEN);
	});

	afterEach(async () => {
		await app.close();
	});

	describe('when response is faster then the request timeout', () => {
		const setup = () => {
			config.incomingRequestTimeout = 1000;
		};

		it('should respond with status code 200', async () => {
			setup();

			const response = await testApiClient.get();

			expect(response.status).toEqual(HttpStatus.OK);
			expect(response.body).toEqual({ message: 'MyMessage' });
		});
	});

	describe('when response is slower then the request timeout', () => {
		const setup = () => {
			config.incomingRequestTimeout = 1;
		};

		it('should respond with status request timeout', async () => {
			setup();

			const response = await testApiClient.get();

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
		});
	});

	describe('when override the default timeout ', () => {
		const setup = () => {
			config.incomingRequestTimeout = 1;
			config[CUSTOM_TIMEOUT_CONFIG_KEY] = 1000;
		};

		it('should respond with status code 200', async () => {
			setup();

			const response = await testApiClient.get('overriden');

			expect(response.status).toEqual(HttpStatus.OK);
			expect(response.body).toEqual({ message: 'MyMessage' });
		});
	});

	describe('when override the default timeout', () => {
		const setup = () => {
			config.incomingRequestTimeout = 1000;
			config[CUSTOM_TIMEOUT_CONFIG_KEY] = 1;
		};

		it('should respond with status request timeout', async () => {
			setup();

			const response = await testApiClient.get('overriden');

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
		});
	});
});
