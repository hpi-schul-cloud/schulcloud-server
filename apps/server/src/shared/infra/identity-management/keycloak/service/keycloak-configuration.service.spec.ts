import { createMock, DeepMocked } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { AuthenticationManagement } from '@keycloak/keycloak-admin-client/lib/resources/authenticationManagement';
import { IdentityProviders } from '@keycloak/keycloak-admin-client/lib/resources/identityProviders';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { SystemRepo } from '@shared/repo';
import { DefaultEncryptionService, SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { v1 } from 'uuid';
import { Realms } from '@keycloak/keycloak-admin-client/lib/resources/realms';
import { SysType } from '../../sys.type';
import { IKeycloakSettings, KeycloakSettings } from '../interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { flowAlias, KeycloakConfigurationService } from './keycloak-configuration.service';
import { OidcIdentityProviderMapper } from '../mapper/identity-provider.mapper';

describe('configureIdentityProviders', () => {
	let module: TestingModule;
	let client: DeepMocked<KeycloakAdminClient>;
	let service: KeycloakConfigurationService;
	let configService: DeepMocked<ConfigService>;
	let repo: DeepMocked<SystemRepo>;
	let defaultEncryptionService: DeepMocked<SymetricKeyEncryptionService>;
	let settings: IKeycloakSettings;

	const kcApiClientIdentityProvidersMock = createMock<IdentityProviders>();
	const kcApiAuthenticationManagementMock = createMock<AuthenticationManagement>();
	const kcApiRealmsMock = createMock<Realms>();
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
	const systems: System[] = [
		{
			_id: new ObjectId(0),
			id: new ObjectId(0).toString(),
			type: SysType.OIDC.toString(),
			alias: 'alias',
			config: {
				clientId: 'clientId',
				clientSecret: 'clientSecret',
				authorizationUrl: 'authorizationUrl',
				tokenUrl: 'tokenUrl',
				logoutUrl: 'logoutUrl',
			},
			createdAt: new Date(),
			updatedAt: new Date(),
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
					}),
				},
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
				{
					provide: KeycloakSettings,
					useFactory: getSettings,
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{ provide: OidcIdentityProviderMapper, useValue: createMock<OidcIdentityProviderMapper>() },
				{ provide: DefaultEncryptionService, useValue: createMock<SymetricKeyEncryptionService>() },
			],
		}).compile();
		client = module.get(KeycloakAdminClient);
		service = module.get(KeycloakConfigurationService);
		configService = module.get(ConfigService);
		settings = module.get(KeycloakSettings);
		repo = module.get(SystemRepo);
		defaultEncryptionService = module.get(DefaultEncryptionService);
		defaultEncryptionService.encrypt.mockImplementation((data) => `${data}_enc`);
		defaultEncryptionService.decrypt.mockImplementation((data) => `${data}_dec`);

		repo.findAll.mockResolvedValue(systems);
		kcApiClientIdentityProvidersMock.find.mockResolvedValue(idps);
		kcApiClientIdentityProvidersMock.create.mockResolvedValue({ id: '' });
		kcApiClientIdentityProvidersMock.update.mockResolvedValue();
		kcApiClientIdentityProvidersMock.del.mockResolvedValue();
	});

	beforeEach(() => {
		repo.findAll.mockClear();
		kcApiClientIdentityProvidersMock.find.mockClear();
		kcApiClientIdentityProvidersMock.create.mockClear();
		kcApiClientIdentityProvidersMock.update.mockClear();
		kcApiClientIdentityProvidersMock.del.mockClear();
		configService.get.mockClear();
	});

	afterAll(() => {
		repo.findAll.mockRestore();
		kcApiClientIdentityProvidersMock.find.mockRestore();
		kcApiClientIdentityProvidersMock.create.mockRestore();
		kcApiClientIdentityProvidersMock.update.mockRestore();
		kcApiClientIdentityProvidersMock.del.mockRestore();
		configService.get.mockRestore();
	});

	it('should read configs from database successfully', async () => {
		const result = await service.configureIdentityProviders();
		expect(result).toBeGreaterThan(0);
		expect(repo.findAll).toBeCalled();
	});

	it('should create a configuration in Keycloak', async () => {
		kcApiClientIdentityProvidersMock.find.mockResolvedValue([]);

		const result = await service.configureIdentityProviders();
		expect(result).toBe(1);
		expect(kcApiClientIdentityProvidersMock.create).toBeCalledTimes(1);

		kcApiClientIdentityProvidersMock.find.mockResolvedValue(idps);
	});
	it('should update a configuration in Keycloak', async () => {
		const result = await service.configureIdentityProviders();
		expect(result).toBe(1);
		expect(kcApiClientIdentityProvidersMock.update).toBeCalledTimes(1);
	});
	it('should delete a new configuration in Keycloak', async () => {
		repo.findAll.mockResolvedValue([]);

		const result = await service.configureIdentityProviders();
		expect(result).toBe(1);
		expect(kcApiClientIdentityProvidersMock.del).toBeCalledTimes(1);

		repo.findAll.mockRestore();
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
