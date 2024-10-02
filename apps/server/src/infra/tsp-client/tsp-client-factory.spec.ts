import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { OauthAdapterService } from '@modules/oauth';
import { ServerConfig } from '@modules/server';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TspClientFactory } from './tsp-client-factory';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: TspClientFactory;
	let configServiceMock: DeepMocked<ConfigService<ServerConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [HttpModule],
			providers: [
				OauthAdapterService,
				TspClientFactory,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>({
						getOrThrow: (key: string) => {
							switch (key) {
								case 'TSP_API_BASE_URL':
									return 'https://test2.schulportal-thueringen.de/tip-ms/api';
								case 'TSP_API_TOKEN_LIFETIME_MS':
									return faker.number.int();
								default:
									throw new Error(`Unknown key: ${key}`);
							}
						},
					}),
				},
			],
		}).compile();

		sut = module.get(TspClientFactory);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('createExportClient', () => {
		describe('when createExportClient is called', () => {
			it('should return ExportApiInterface', () => {
				const result = sut.createExportClient({
					clientId: faker.string.alpha(),
					clientSecret: faker.string.alpha(),
					tokenEndpoint: faker.internet.url(),
				});

				expect(result).toBeDefined();
				expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
			});
		});

		describe('when token is cached', () => {
			const setup = () => {
				const client = sut.createExportClient({
					clientId: faker.string.alpha(),
					clientSecret: faker.string.alpha(),
					tokenEndpoint: faker.internet.url(),
				});

				Reflect.set(sut, 'cachedToken', faker.string.alpha());

				return client;
			};

			it('should return ExportApiInterface', () => {
				const result = setup();

				expect(result).toBeDefined();
				expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
			});
		});
	});

	// HINT: If you want to test the actual API, you can use the following test and fill in the required data.
	describe.skip('when using the created client', () => {
		const setup = () => {
			const client = sut.createExportClient({
				clientId: '<clientId>',
				clientSecret: '<clientSecret>',
				tokenEndpoint: '<tokenEndpoint>',
			});

			return client;
		};

		it('should return the migration version', async () => {
			const client = setup();

			const result = await client.version();

			expect(result.status).toBe(200);
			expect(result.data.version).toBe('1.1');
		});
	});
});
