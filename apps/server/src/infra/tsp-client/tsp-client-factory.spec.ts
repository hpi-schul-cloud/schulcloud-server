import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { OauthAdapterService } from '@modules/oauth';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosErrorLoggable, ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import axios, { AxiosError } from 'axios';
import { DefaultEncryptionService, EncryptionService } from '../encryption';
import { TspClientFactory } from './tsp-client-factory';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: TspClientFactory;
	let configServiceMock: DeepMocked<ConfigService<ServerConfig, true>>;
	let oauthAdapterServiceMock: DeepMocked<OauthAdapterService>;
	let encryptionService: DeepMocked<EncryptionService>;
	let logger: DeepMocked<Logger>;

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
								case 'TSP_API_CLIENT_BASE_URL':
									return faker.internet.url();
								case 'TSP_API_CLIENT_TOKEN_LIFETIME_MS':
									return faker.number.int();
								default:
									throw new Error(`Unknown key: ${key}`);
							}
						},
					}),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();

		sut = module.get(TspClientFactory);
		configServiceMock = module.get(ConfigService);
		oauthAdapterServiceMock = module.get(OauthAdapterService);
		encryptionService = module.get(DefaultEncryptionService);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
		jest.clearAllMocks();
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
	});

	describe('getAccessToken', () => {
		describe('when called successfully', () => {
			const setup = () => {
				const clientId = faker.string.alpha();
				const clientSecret = faker.string.alpha();
				const tokenEndpoint = faker.internet.url();

				oauthAdapterServiceMock.sendTokenRequest.mockResolvedValue({
					accessToken: faker.string.alpha(),
					idToken: faker.string.alpha(),
					refreshToken: faker.string.alpha(),
				});

				Reflect.set(sut, 'cachedToken', undefined);

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
				expect(encryptionService.decrypt).toHaveBeenCalled();
			});
		});

		describe('when token is cached', () => {
			const setup = () => {
				const clientId = faker.string.alpha();
				const clientSecret = faker.string.alpha();
				const tokenEndpoint = faker.internet.url();
				const client = sut.createExportClient({
					clientId,
					clientSecret,
					tokenEndpoint,
				});

				const cached = faker.string.alpha();
				Reflect.set(sut, 'cachedToken', cached);
				Reflect.set(sut, 'tokenExpiresAt', Date.now() + 60000);

				return { clientId, clientSecret, tokenEndpoint, client, cached };
			};

			it('should return ExportApiInterface', async () => {
				const { clientId, clientSecret, tokenEndpoint, cached } = setup();

				const result = await sut.getAccessToken({ clientId, clientSecret, tokenEndpoint });

				expect(result).toBe(cached);
				expect(configServiceMock.getOrThrow).toHaveBeenCalledTimes(0);
			});
		});

		describe('when an AxiosError occurs', () => {
			const setup = () => {
				const clientId = faker.string.alpha();
				const clientSecret = faker.string.alpha();
				const tokenEndpoint = faker.internet.url();

				oauthAdapterServiceMock.sendTokenRequest.mockImplementation(() => {
					throw new AxiosError();
				});

				Reflect.set(sut, 'cachedToken', undefined);

				return {
					clientId,
					clientSecret,
					tokenEndpoint,
				};
			};

			it('should log an AxiosErrorLoggable as warning and reject', async () => {
				const params = setup();

				await expect(() => sut.getAccessToken(params)).rejects.toBeUndefined();

				expect(logger.warning).toHaveBeenCalledWith(new AxiosErrorLoggable(new AxiosError(), 'TSP_OAUTH_ERROR'));
			});
		});

		describe('when a generic error occurs', () => {
			const setup = () => {
				const clientId = faker.string.alpha();
				const clientSecret = faker.string.alpha();
				const tokenEndpoint = faker.internet.url();

				oauthAdapterServiceMock.sendTokenRequest.mockImplementation(() => {
					throw new Error();
				});

				Reflect.set(sut, 'cachedToken', undefined);

				return {
					clientId,
					clientSecret,
					tokenEndpoint,
				};
			};

			it('should log an ErrorLoggable as warning and reject', async () => {
				const params = setup();

				await expect(() => sut.getAccessToken(params)).rejects.toBeUndefined();

				expect(logger.warning).toHaveBeenCalledWith(new ErrorLoggable(new Error()));
			});
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
