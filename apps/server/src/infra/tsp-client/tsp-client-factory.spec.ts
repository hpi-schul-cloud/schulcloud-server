import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { OauthAdapterService } from '@modules/oauth-adapter';
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { DefaultEncryptionService, EncryptionService } from '../encryption';
import { TspAccessTokenLoggableError } from './loggable/tsp-access-token.loggable-error';
import { TspClientFactory } from './tsp-client-factory';
import { TSP_CLIENT_CONFIG_TOKEN } from './tsp-client.config';

describe('TspClientFactory', () => {
	let module: TestingModule;
	let sut: TspClientFactory;
	let oauthAdapterServiceMock: DeepMocked<OauthAdapterService>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TspClientFactory,
				{
					provide: OauthAdapterService,
					useValue: createMock<OauthAdapterService>(),
				},
				{
					provide: TSP_CLIENT_CONFIG_TOKEN,
					useValue: {
						baseUrl: faker.internet.url(),
						tokenLifetimeMs: faker.number.int(),
					},
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		sut = module.get(TspClientFactory);
		oauthAdapterServiceMock = module.get(OauthAdapterService);
		encryptionService = module.get(DefaultEncryptionService);
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

			it('should throw TspAccessTokenLoggableError', async () => {
				const params = setup();

				await expect(() => sut.getAccessToken(params)).rejects.toThrow(TspAccessTokenLoggableError);
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

			it('should throw TspAccessTokenLoggableError', async () => {
				const params = setup();

				await expect(() => sut.getAccessToken(params)).rejects.toThrow(TspAccessTokenLoggableError);
			});
		});

		describe('when a non-error type is thrown', () => {
			const setup = () => {
				const clientId = faker.string.uuid();
				const clientSecret = faker.string.alphanumeric(40);
				const tokenEndpoint = faker.internet.url();

				oauthAdapterServiceMock.sendTokenRequest.mockImplementation(() => {
					// eslint-disable-next-line @typescript-eslint/no-throw-literal
					throw 'error';
				});

				Reflect.set(sut, 'cachedToken', undefined);

				return {
					clientId,
					clientSecret,
					tokenEndpoint,
				};
			};

			it('should throw TspAccessTokenLoggableError', async () => {
				const params = setup();

				await expect(() => sut.getAccessToken(params)).rejects.toThrow(TspAccessTokenLoggableError);
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
