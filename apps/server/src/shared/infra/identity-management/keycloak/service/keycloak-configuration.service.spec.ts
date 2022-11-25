import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { AuthenticationManagement } from '@keycloak/keycloak-admin-client/lib/resources/authenticationManagement';
import { Clients } from '@keycloak/keycloak-admin-client/lib/resources/clients';
import { IdentityProviders } from '@keycloak/keycloak-admin-client/lib/resources/identityProviders';
import { Realms } from '@keycloak/keycloak-admin-client/lib/resources/realms';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemTypeEnum } from '@shared/domain';
import { DefaultEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { systemFactory } from '@shared/testing';
import { SystemDto } from '@src/modules/system/service/dto/system.dto';
import { SystemService } from '@src/modules/system/service/system.service';
import { v1 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { IKeycloakSettings, KeycloakSettings } from '../interface';
import { OidcIdentityProviderMapper } from '../mapper/identity-provider.mapper';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { KeycloakConfigurationService } from './keycloak-configuration.service';

describe('KeycloakConfigurationService Unit', () => {
	let module: TestingModule;
	let client: DeepMocked<KeycloakAdminClient>;
	let service: KeycloakConfigurationService;
	let configService: DeepMocked<ConfigService>;
	let systemService: DeepMocked<SystemService>;
	let httpServiceMock: DeepMocked<HttpService>;
	let defaultEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let settings: IKeycloakSettings;

	const kcApiClientIdentityProvidersMock = createMock<IdentityProviders>();
	const kcApiClientMock = createMock<Clients>();
	const kcApiAuthenticationManagementMock = createMock<AuthenticationManagement>();
	const kcApiRealmsMock = createMock<Realms>();
	const encryptionServiceMock = createMock<SymetricKeyEncryptionService>();
	const adminUsername = 'admin';

	const adminUser: UserRepresentation = {
		id: v1(),
		firstName: 'admin',
		lastName: 'admin',
		email: 'admin@email.tld',
		username: adminUsername,
	};

	const getSettings = (): IKeycloakSettings => {
		return {
			baseUrl: 'http://localhost:8080',
			realmName: 'master',
			clientId: 'dBildungscloud',
			credentials: {
				username: adminUsername,
				password: 'password',
				grantType: 'password',
				clientId: 'client-id',
			},
		};
	};

	const idps: IdentityProviderRepresentation[] = [
		{
			providerId: 'oidc',
			alias: 'alias',
			enabled: true,
			config: {
				clientId: 'clientId',
				clientSecret: 'clientSecret',
				authorizationUrl: 'authorizationUrl',
				tokenUrl: 'tokenUrl',
				logoutUrl: 'logoutUrl',
			},
		},
	];
	const systems: SystemDto[] = [
		{
			id: new ObjectId(0).toString(),
			type: SystemTypeEnum.OIDC.toString(),
			alias: 'alias',
			oidcConfig: {
				clientId: 'clientId',
				clientSecret: 'clientSecret',
				authorizationUrl: 'authorizationUrl',
				tokenUrl: 'tokenUrl',
				logoutUrl: 'logoutUrl',
			},
		},
	];

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakConfigurationService,
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest.fn().mockImplementation(async (): Promise<KeycloakAdminClient> => {
							return Promise.resolve(client);
						}),
						testKcConnection: jest.fn().mockResolvedValue(true),
						getAdminUser: jest.fn().mockReturnValue(adminUser.username),
					},
				},
				{
					provide: KeycloakAdminClient,
					useValue: createMock<KeycloakAdminClient>({
						auth: (): Promise<void> => {
							if (settings.credentials.username !== adminUser.username) throw new Error();
							return Promise.resolve();
						},
						setConfig: () => {},
						identityProviders: kcApiClientIdentityProvidersMock,
						authenticationManagement: kcApiAuthenticationManagementMock,
						realms: kcApiRealmsMock,
						clients: kcApiClientMock,
					}),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: KeycloakSettings,
					useFactory: getSettings,
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>({
						get: (key: string) => `${key}-value`,
					}),
				},
				{
					provide: DefaultEncryptionService,
					useValue: encryptionServiceMock,
				},
				{
					provide: OidcIdentityProviderMapper,
					useValue: createMock<OidcIdentityProviderMapper>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();
		client = module.get(KeycloakAdminClient);
		service = module.get(KeycloakConfigurationService);
		configService = module.get(ConfigService);
		settings = module.get(KeycloakSettings);
		systemService = module.get(SystemService);
		httpServiceMock = module.get(HttpService);
		defaultEncryptionService = module.get(DefaultEncryptionService);
		defaultEncryptionService.encrypt.mockImplementation((data) => `${data}_enc`);
		defaultEncryptionService.decrypt.mockImplementation((data) => `${data}_dec`);
		jest.spyOn(Configuration, 'get').mockReturnValue('localhost');
	});

	afterAll(async () => {
		jest.resetAllMocks();
		await module.close();
	});

	beforeEach(() => {
		systemService.findOidc.mockResolvedValue(systems);
		kcApiClientIdentityProvidersMock.find.mockResolvedValue(idps);
		kcApiClientIdentityProvidersMock.create.mockResolvedValue({ id: '' });
		kcApiClientIdentityProvidersMock.update.mockResolvedValue();
		kcApiClientIdentityProvidersMock.del.mockResolvedValue();
	});

	afterEach(() => {
		systemService.findOidc.mockClear();
		kcApiClientIdentityProvidersMock.find.mockClear();
		kcApiClientIdentityProvidersMock.create.mockClear();
		kcApiClientIdentityProvidersMock.update.mockClear();
		kcApiClientIdentityProvidersMock.del.mockClear();
		kcApiClientIdentityProvidersMock.updateMapper.mockClear();
		kcApiClientIdentityProvidersMock.createMapper.mockClear();
		configService.get.mockClear();
	});

	describe('configureIdentityProviders', () => {
		it('should read configs from database successfully', async () => {
			const result = await service.configureIdentityProviders();
			expect(result).toBeGreaterThan(0);
			expect(systemService.findOidc).toBeCalled();
		});

		it('should create a configuration in Keycloak', async () => {
			kcApiClientIdentityProvidersMock.find.mockResolvedValue([]);

			const result = await service.configureIdentityProviders();
			expect(result).toBe(1);
			expect(kcApiClientIdentityProvidersMock.create).toBeCalledTimes(1);
		});
		it('should update a configuration in Keycloak', async () => {
			const result = await service.configureIdentityProviders();
			expect(result).toBe(1);
			expect(kcApiClientIdentityProvidersMock.update).toBeCalledTimes(1);
		});
		it('should delete a new configuration in Keycloak', async () => {
			systemService.findOidc.mockResolvedValue([]);

			const result = await service.configureIdentityProviders();
			expect(result).toBe(1);
			expect(kcApiClientIdentityProvidersMock.del).toBeCalledTimes(1);
		});
		it('should add a mapper to a newly created identity provider', async () => {
			kcApiClientIdentityProvidersMock.find.mockResolvedValue([]);

			await service.configureIdentityProviders();
			expect(kcApiClientIdentityProvidersMock.createMapper).toBeCalledTimes(1);
		});
		it('should create a mapper for an updated identity provider if non existed before', async () => {
			kcApiClientIdentityProvidersMock.findMappers.mockResolvedValue([]);
			await service.configureIdentityProviders();
			expect(kcApiClientIdentityProvidersMock.createMapper).toBeCalledTimes(1);
		});
		it('should update a mapper for an updated  identity provider', async () => {
			kcApiClientIdentityProvidersMock.findMappers.mockResolvedValue([
				{ id: '1', identityProviderAlias: idps[0].alias, name: 'oidc-username-idp-mapper' },
			]);
			await service.configureIdentityProviders();
			expect(kcApiClientIdentityProvidersMock.updateMapper).toBeCalledTimes(1);
		});
	});

	describe('configureClient', () => {
		beforeAll(() => {
			encryptionServiceMock.encrypt.mockImplementation((value: string) => `encrypted: ${value}`);
			kcApiClientMock.find.mockResolvedValue([]);
			kcApiClientMock.create.mockResolvedValue({ id: 'new_client_id' });
			kcApiClientMock.generateNewClientSecret.mockResolvedValue({ type: 'secret', value: 'generated_client_secret' });
			systemService.find.mockResolvedValue([]);
			const response = {
				data: {
					token_endpoint: 'tokenEndpoint',
					authorization_endpoint: 'authEndpoint',
					end_session_endpoint: 'logoutEndpoint',
					jwks_uri: 'jwksUrl',
				},
			} as AxiosResponse<unknown>;
			httpServiceMock.get.mockReturnValue(of(response));
		});

		afterAll(() => {
			kcApiClientMock.find.mockRestore();
			kcApiClientMock.findOne.mockRestore();
			kcApiClientMock.create.mockRestore();
			kcApiClientMock.generateNewClientSecret.mockRestore();
			systemService.find.mockRestore();
		});

		beforeEach(() => {
			encryptionServiceMock.encrypt.mockClear();
			kcApiClientMock.find.mockClear();
			kcApiClientMock.findOne.mockClear();
			kcApiClientMock.create.mockClear();
			kcApiClientMock.generateNewClientSecret.mockClear();
			systemService.find.mockClear();
			systemService.save.mockClear();
		});

		it('should create client if client not exists', async () => {
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(kcApiClientMock.create).toBeCalledTimes(1);
		});
		it('should not create client if client already exists', async () => {
			kcApiClientMock.find.mockResolvedValueOnce([{ id: 'old_client_id' }]);
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(kcApiClientMock.create).toBeCalledTimes(0);
		});
		it('should generate a new client secret', async () => {
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(kcApiClientMock.generateNewClientSecret).toBeCalledTimes(1);
		});
		it('should encrypt client secret', async () => {
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(encryptionServiceMock.encrypt).toBeCalledTimes(1);
		});
		it('should save client secret', async () => {
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(systemService.save).toHaveBeenCalledWith(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					oauthConfig: expect.objectContaining({ clientSecret: expect.anything() }),
				})
			);
		});
		it('should create Keycloak system if not already exists', async () => {
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(systemService.save).toHaveBeenCalledWith(expect.objectContaining({ type: SystemTypeEnum.KEYCLOAK }));
		});
		it('should not create Keycloak system if already exists', async () => {
			const mockedSystem = systemFactory.buildWithId();
			systemService.find.mockResolvedValueOnce([mockedSystem]);
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(systemService.save).toHaveBeenCalledWith(expect.objectContaining({ _id: mockedSystem._id }));
		});
	});

	describe('configureBrokerFlows', () => {
		beforeAll(() => {
			kcApiRealmsMock.makeRequest.mockImplementation(() => async () => Promise.resolve([{ id: 'id' }]));
		});

		beforeEach(() => {
			kcApiRealmsMock.makeRequest.mockClear();
		});

		it('should create flow', async () => {
			await expect(service.configureBrokerFlows()).resolves.not.toThrow();
			expect(kcApiRealmsMock.makeRequest).toBeCalledWith(
				expect.objectContaining({
					method: 'POST',
					path: '/{realmName}/authentication/flows',
					urlParamKeys: ['realmName'],
				})
			);
			expect(kcApiRealmsMock.makeRequest).toBeCalledWith(
				expect.objectContaining({
					method: 'GET',
					path: '/{realmName}/authentication/flows',
					urlParamKeys: ['realmName'],
				})
			);
			expect(kcApiRealmsMock.makeRequest).toBeCalledWith(
				expect.objectContaining({
					method: 'GET',
					path: '/{realmName}/authentication/flows/{flowAlias}/executions',
					urlParamKeys: ['realmName', 'flowAlias'],
				})
			);
			expect(kcApiRealmsMock.makeRequest).toBeCalledWith(
				expect.objectContaining({
					method: 'POST',
					path: '/{realmName}/authentication/flows/{flowAlias}/executions/execution',
					urlParamKeys: ['realmName', 'flowAlias'],
				})
			);
			expect(kcApiRealmsMock.makeRequest).toBeCalledWith(
				expect.objectContaining({
					method: 'PUT',
					path: '/{realmName}/authentication/flows/{flowAlias}/executions',
					urlParamKeys: ['realmName', 'flowAlias'],
				})
			);
		});
		it('should skip flow creation', async () => {
			const flowAlias = 'Direct Broker Flow';
			kcApiRealmsMock.makeRequest.mockImplementation(
				() => async () => Promise.resolve([{ alias: flowAlias, id: 'id' }])
			);

			await expect(service.configureBrokerFlows()).resolves.not.toThrow();
			expect(kcApiRealmsMock.makeRequest).toBeCalledWith(
				expect.objectContaining({
					method: 'GET',
					path: '/{realmName}/authentication/flows',
					urlParamKeys: ['realmName'],
				})
			);
			expect(kcApiRealmsMock.makeRequest).not.toBeCalledWith(
				expect.objectContaining({
					method: 'GET',
					path: '/{realmName}/authentication/flows/{flowAlias}/executions',
					urlParamKeys: ['realmName', 'flowAlias'],
				})
			);
			expect(kcApiRealmsMock.makeRequest).not.toBeCalledWith(
				expect.objectContaining({
					method: 'POST',
					path: '/{realmName}/authentication/flows/{flowAlias}/executions/execution',
					urlParamKeys: ['realmName', 'flowAlias'],
				})
			);
			expect(kcApiRealmsMock.makeRequest).not.toBeCalledWith(
				expect.objectContaining({
					method: 'PUT',
					path: '/{realmName}/authentication/flows/{flowAlias}/executions',
					urlParamKeys: ['realmName', 'flowAlias'],
				})
			);
		});
	});
});
