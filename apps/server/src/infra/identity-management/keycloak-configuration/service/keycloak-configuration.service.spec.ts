import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SymmetricKeyEncryptionService } from '@infra/encryption';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { AuthenticationManagement } from '@keycloak/keycloak-admin-client/lib/resources/authenticationManagement';
import { Clients } from '@keycloak/keycloak-admin-client/lib/resources/clients';
import { IdentityProviders } from '@keycloak/keycloak-admin-client/lib/resources/identityProviders';
import { Realms } from '@keycloak/keycloak-admin-client/lib/resources/realms';
import { SystemService } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { v1 } from 'uuid';
import { KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN } from '../../keycloak-administration/keycloak-administration.config';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KEYCLOAK_CONFIGURATION_CONFIG_TOKEN, KeycloakConfigurationConfig } from '../keycloak-configuration.config';
import { OidcIdentityProviderMapper } from '../mapper/identity-provider.mapper';
import { KeycloakConfigurationService } from './keycloak-configuration.service';

describe('KeycloakConfigurationService Unit', () => {
	let module: TestingModule;
	let client: DeepMocked<KeycloakAdminClient>;
	let service: KeycloakConfigurationService;
	let config: KeycloakConfigurationConfig;
	let systemService: DeepMocked<SystemService>;
	let httpServiceMock: DeepMocked<HttpService>;

	const kcApiClientIdentityProvidersMock = createMock<IdentityProviders>();
	const kcApiClientMock = createMock<Clients>();
	const kcApiAuthenticationManagementMock = createMock<AuthenticationManagement>();
	const kcApiRealmsMock = createMock<Realms>();
	const encryptionServiceMock = createMock<SymmetricKeyEncryptionService>();
	const adminUsername = 'admin';

	const adminUser: UserRepresentation = {
		id: v1(),
		firstName: 'admin',
		lastName: 'admin',
		email: 'admin@email.tld',
		username: adminUsername,
	};

	const systems = systemFactory.withOidcConfig().buildList(1);
	const idps: IdentityProviderRepresentation[] = [
		{
			providerId: 'oidc',
			alias: systems[0].oidcConfig?.idpHint,
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

	const keycloakAdminConfigValues = {
		internalBaseUrl: 'http://localhost:8080',
		externalBaseUrl: 'http://localhost:8080',
		realmName: 'master',
		clientId: 'dBildungscloud',
		credentials: {
			username: adminUsername,
			password: 'password',
			grantType: 'password',
			clientId: 'client-id',
		},
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakConfigurationService,
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest
							.fn()
							.mockImplementation(async (): Promise<KeycloakAdminClient> => Promise.resolve(client)),
						testKcConnection: jest.fn().mockResolvedValue(true),
						getAdminUser: jest.fn().mockReturnValue(adminUser.username),
						getClientId: jest.fn().mockResolvedValue(keycloakAdminConfigValues.clientId),
						getClientSecret: jest.fn().mockResolvedValue('clientSecret'),
					},
				},
				{
					provide: KeycloakAdminClient,
					useValue: createMock<KeycloakAdminClient>({
						auth: (): Promise<void> => {
							if (keycloakAdminConfigValues.credentials.username !== adminUser.username) throw new Error();
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
					provide: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
					useValue: keycloakAdminConfigValues,
				},
				{
					provide: KEYCLOAK_CONFIGURATION_CONFIG_TOKEN,
					useValue: KeycloakConfigurationConfig,
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
		config = module.get<KeycloakConfigurationConfig>(KEYCLOAK_CONFIGURATION_CONFIG_TOKEN);
		systemService = module.get(SystemService);
		httpServiceMock = module.get(HttpService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		systemService.find.mockResolvedValue(systems);
		kcApiClientIdentityProvidersMock.find.mockResolvedValue(idps);
		kcApiClientIdentityProvidersMock.create.mockResolvedValue({ id: '' });
		kcApiClientIdentityProvidersMock.update.mockResolvedValue();
		kcApiClientIdentityProvidersMock.del.mockResolvedValue();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('configureIdentityProviders', () => {
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
			systemService.find.mockResolvedValue([]);

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
		it('should update a mapper for an updated identity provider', async () => {
			kcApiClientIdentityProvidersMock.findMappers.mockResolvedValue([
				{ id: '1', identityProviderAlias: idps[0].alias, name: 'OIDC User Attribute Mapper' },
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
					issuer: 'issuer',
				},
			} as AxiosResponse<unknown>;
			httpServiceMock.get.mockReturnValue(of(response));
		});

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should create client if client not exists', async () => {
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(kcApiClientMock.create).toBeCalledTimes(1);
		});

		it('should create a redirectUri with localhost', async () => {
			config.scDomain = 'localhost';
			await expect(service.configureClient()).resolves.not.toThrow();
		});

		it('should create a redirectUri with something other than localhost', async () => {
			config.scDomain = 'anotherDomain';
			await expect(service.configureClient()).resolves.not.toThrow();
		});

		it('should not create client if client already exists', async () => {
			kcApiClientMock.find.mockResolvedValueOnce([{ id: 'old_client_id' }]);
			await expect(service.configureClient()).resolves.not.toThrow();
			expect(kcApiClientMock.create).toBeCalledTimes(0);
		});
		// TODO Add client protocol mapper test, create / update cases
		it('should add a mapper to a newly created identity provider', async () => {
			kcApiClientMock.listProtocolMappers.mockResolvedValue([]);

			await service.configureClient();
			expect(kcApiClientMock.addProtocolMapper).toBeCalledTimes(1);
		});
		it('should update a mapper for an updated identity provider', async () => {
			kcApiClientMock.listProtocolMappers.mockResolvedValue([{ id: '1', name: 'External Sub Mapper' }]);
			await service.configureClient();
			expect(kcApiClientMock.updateProtocolMapper).toBeCalledTimes(1);
			expect(kcApiClientMock.addProtocolMapper).not.toBeCalled();
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

	describe('configureRealm', () => {
		it('should update the realm', async () => {
			const updateMock = jest.spyOn(kcApiRealmsMock, 'update');

			await service.configureRealm();
			expect(updateMock).toHaveBeenCalledWith(
				expect.anything(),
				expect.objectContaining({ editUsernameAllowed: true })
			);
		});
	});
});
