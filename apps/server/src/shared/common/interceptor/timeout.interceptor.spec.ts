import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RequestTimeout, TimeoutInterceptor } from '@shared/common';
import { TestApiClient } from '@shared/testing';

const delay = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

@Controller()
class TestController {
	@Get()
	async testDefault(): Promise<{ message: string }> {
		await delay(100);

		return { message: 'MyMessage' };
	}

	@Get('overriden')
	@RequestTimeout('MY_CONFIG_NAME')
	async testOverriden(): Promise<{ message: string }> {
		await delay(100);

		return { message: 'MyMessage' };
	}
}

describe('TimeoutInterceptor', () => {
	let app: INestApplication;
	let configServiceMock: DeepMocked<ConfigService>;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			providers: [
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: APP_INTERCEPTOR,
					useFactory: (configService: ConfigService) => new TimeoutInterceptor(configService),
					inject: [ConfigService],
				},
			],
			controllers: [TestController],
		}).compile();

		app = moduleFixture.createNestApplication();
		configServiceMock = app.get(ConfigService);
		await app.init();

		testApiClient = new TestApiClient(app, '');
	});

	afterEach(async () => {
		await app.close();
	});

	describe('when response is faster then the request timeout', () => {
		const setup = () => {
			configServiceMock.getOrThrow.mockReturnValueOnce(1000);
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
			configServiceMock.getOrThrow.mockReturnValueOnce(1);
		};

		it('should respond with status request timeout', async () => {
			setup();

			const response = await testApiClient.get();

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
		});
	});

	describe('when override the default timeout ', () => {
		const setup = () => {
			configServiceMock.getOrThrow.mockImplementationOnce((key: string) => {
				const result = key === 'MY_CONFIG_NAME' ? 1000 : 1;

				return result;
			});
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
			configServiceMock.getOrThrow.mockImplementationOnce((key: string) => {
				const result = key === 'MY_CONFIG_NAME' ? 1 : 1000;

				return result;
			});
		};

		it('should respond with status request timeout', async () => {
			setup();

			const response = await testApiClient.get('overriden');

			expect(response.status).toEqual(HttpStatus.REQUEST_TIMEOUT);
		});
	});

	describe('when requested config is not a number', () => {
		const setup = () => {
			configServiceMock.getOrThrow.mockReturnValueOnce('string');
		};

		it('should respond with status request timeout', async () => {
			setup();

			const response = await testApiClient.get('overriden');

			expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
		});
	});
});
