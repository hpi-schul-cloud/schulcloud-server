import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { OauthAdapterService } from '@modules/oauth';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { TspClientFactory } from './tsp-client-factory';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: TspClientFactory;
	let configServiceMock: DeepMocked<ConfigService<ServerConfig, true>>;
	let oauthAdapterServiceMock: DeepMocked<OauthAdapterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspClientFactory,
				{
					provide: OauthAdapterService,
					useValue: createMock<OauthAdapterService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>({
						getOrThrow: (key: string) => {
							switch (key) {
								case 'TSP_API_BASE_URL':
									return faker.internet.url();
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
		oauthAdapterServiceMock = module.get(OauthAdapterService);
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

	describe('getAccessToken', () => {
		const setup = () => {
			const clientId = faker.string.alpha();
			const clientSecret = faker.string.alpha();
			const tokenEndpoint = faker.internet.url();

			oauthAdapterServiceMock.sendTokenRequest.mockResolvedValue({
				accessToken: faker.string.alpha(),
				idToken: faker.string.alpha(),
				refreshToken: faker.string.alpha(),
			});

			return {
				clientId,
				clientSecret,
				tokenEndpoint,
			};
		};

		it('should return access token', async () => {
			const params = setup();

			const response = await sut.getAccessToken(params);

			expect(response).toBeDefined();
			expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
		});
	});

	describe('when using the created client', () => {
		const setup = () => {
			const client = sut.createExportClient({
				clientId: '<clientId>',
				clientSecret: '<clientSecret>',
				tokenEndpoint: '<tokenEndpoint>',
			});

			jest.mock('axios');

			oauthAdapterServiceMock.sendTokenRequest.mockResolvedValue({
				accessToken: faker.string.alpha(),
				idToken: faker.string.alpha(),
				refreshToken: faker.string.alpha(),
			});

			const axiosMock = axios as jest.Mocked<typeof axios>;

			axiosMock.request = jest.fn();
			axiosMock.request.mockResolvedValue({
				data: {
					version: '1.1',
				},
			});

			return {
				client,
				axiosMock,
			};
		};

		it('should return the migration version', async () => {
			const { client, axiosMock } = setup();

			const response = await client.version();

			expect(axiosMock.request).toHaveBeenCalledTimes(1);
			expect(response.data.version).toBe('1.1');
		});
	});
});
