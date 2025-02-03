import { DomainErrorHandler } from '@core/error';
import { AxiosErrorLoggable, ErrorLoggable } from '@core/error/loggable';
import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { TspAccessTokenLoggableError } from '@infra/tsp-client/loggable/tsp-access-token.loggable-error';
import { OauthAdapterService } from '@modules/oauth';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { DefaultEncryptionService, EncryptionService } from '../encryption';
import { TspClientFactory } from './tsp-client-factory';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: TspClientFactory;
	let configServiceMock: DeepMocked<ConfigService<ServerConfig, true>>;
	let oauthAdapterServiceMock: DeepMocked<OauthAdapterService>;
	let encryptionService: DeepMocked<EncryptionService>;
	let domainErrorHandler: DeepMocked<DomainErrorHandler>;

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
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
			],
		}).compile();

		sut = module.get(TspClientFactory);
		configServiceMock = module.get(ConfigService);
		oauthAdapterServiceMock = module.get(OauthAdapterService);
		encryptionService = module.get(DefaultEncryptionService);
		domainErrorHandler = module.get(DomainErrorHandler);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('createExportClient', () => {
		describe('when createExportClient is called', () => {
			it('should return ExportApiInterface', () => {
				const result = sut.createExportClient({
					clientId: faker.string.uuid(),
					clientSecret: faker.string.alphanumeric(40),
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
				const clientId = faker.string.uuid();
				const clientSecret = faker.string.alphanumeric(40);
				const tokenEndpoint = faker.internet.url();

				oauthAdapterServiceMock.sendTokenRequest.mockResolvedValueOnce({
					accessToken: faker.string.alphanumeric(40),
					idToken: faker.string.alphanumeric(40),
					refreshToken: faker.string.alphanumeric(40),
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
				expect(encryptionService.decrypt).toHaveBeenCalled();
			});
		});

		describe('when token is cached', () => {
			const setup = () => {
				const clientId = faker.string.uuid();
				const clientSecret = faker.string.alphanumeric(40);
				const tokenEndpoint = faker.internet.url();
				const client = sut.createExportClient({
					clientId,
					clientSecret,
					tokenEndpoint,
				});

				const cached = faker.string.alphanumeric(40);
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
				const clientId = faker.string.uuid();
				const clientSecret = faker.string.alphanumeric(40);
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

				await expect(() => sut.getAccessToken(params)).rejects.toThrow(TspAccessTokenLoggableError);

				expect(domainErrorHandler.exec).toHaveBeenCalledWith(
					new AxiosErrorLoggable(new AxiosError(), 'TSP_OAUTH_ERROR')
				);
			});
		});

		describe('when a generic error occurs', () => {
			const setup = () => {
				const clientId = faker.string.uuid();
				const clientSecret = faker.string.alphanumeric(40);
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

				await expect(() => sut.getAccessToken(params)).rejects.toThrow(TspAccessTokenLoggableError);

				expect(domainErrorHandler.exec).toHaveBeenCalledWith(new ErrorLoggable(new Error()));
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

			oauthAdapterServiceMock.sendTokenRequest.mockResolvedValueOnce({
				accessToken: faker.string.alphanumeric(40),
				idToken: faker.string.alphanumeric(40),
				refreshToken: faker.string.alphanumeric(40),
			});

			const axiosMock = axios as jest.Mocked<typeof axios>;

			jest.spyOn(axiosMock, 'request').mockImplementation();
			axiosMock.request.mockResolvedValueOnce({
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
