import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ServerConfig } from '@src/modules/server';
import { TspClientFactory } from './tsp-client-factory';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: TspClientFactory;
	let configServiceMock: DeepMocked<ConfigService<ServerConfig, true>>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspClientFactory,
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>({
						getOrThrow: (key: string) => {
							switch (key) {
								case 'SC_DOMAIN':
									return faker.internet.domainName();
								case 'HOST':
									return faker.internet.url();
								case 'TSP_API_BASE_URL':
									return 'https://test2.schulportal-thueringen.de/tip-ms/api/';
								case 'TSP_API_CLIENT_ID':
									return faker.string.uuid();
								case 'TSP_API_CLIENT_SECRET':
									return faker.string.uuid();
								case 'TSP_API_SIGNATURE_KEY':
									return faker.string.uuid();
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
				const result = sut.createExportClient();

				expect(result).toBeDefined();
				expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
			});
		});

		describe('when token is cached', () => {
			const setup = () => {
				Reflect.set(sut, 'cachedToken', faker.string.alpha());
				const client = sut.createExportClient();

				return client;
			};

			it('should return ExportApiInterface', () => {
				const result = setup();

				expect(result).toBeDefined();
				expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
			});
		});
	});

	// TODO: add a working integration test
	describe.skip('when using the created client', () => {
		const setup = () => {
			const client = sut.createExportClient();

			return client;
		};

		it('should return the migration version', async () => {
			const client = setup();

			const result = await client.version();

			expect(result.status).toBe(200);
			expect(result.data.version).toBeDefined();
		});
	});
});
