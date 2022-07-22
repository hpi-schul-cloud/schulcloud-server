import fs from 'node:fs/promises';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
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
import { v1 } from 'uuid';
import { SysType } from '../../sys.type';
import {
	IKeycloakSettings,
	IKeycloakManagementInputFiles,
	KeycloakManagementInputFiles,
	KeycloakSettings,
} from '../interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { KeycloakConfigurationService } from './keycloak-configuration.service';

describe('configureIdentityProviders', () => {
	let module: TestingModule;
	let client: DeepMocked<KeycloakAdminClient>;
	let service: KeycloakConfigurationService;
	let configService: DeepMocked<ConfigService>;
	let repo: DeepMocked<SystemRepo>;
	let settings: IKeycloakSettings;

	const kcApiClientIdentityProvidersMock = createMock<IdentityProviders>();
	const kcApiAuthenticationManagementMock = createMock<AuthenticationManagement>();
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

	const inputFiles: IKeycloakManagementInputFiles = {
		accountsFile: 'accounts.json',
		usersFile: 'users.json',
		systemsFile: 'systems.json',
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
	let fsReadFile: jest.SpyInstance;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: KeycloakManagementInputFiles,
					useValue: inputFiles,
				},
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
			],
		}).compile();
		client = module.get(KeycloakAdminClient);
		service = module.get(KeycloakConfigurationService);
		configService = module.get(ConfigService);
		settings = module.get(KeycloakSettings);
		repo = module.get(SystemRepo);

		repo.findAll.mockResolvedValue(systems);
		kcApiClientIdentityProvidersMock.find.mockResolvedValue(idps);
		kcApiClientIdentityProvidersMock.create.mockResolvedValue({ id: '' });
		kcApiClientIdentityProvidersMock.update.mockResolvedValue();
		kcApiClientIdentityProvidersMock.del.mockResolvedValue();
		fsReadFile = jest.spyOn(fs, 'readFile').mockImplementation((path) => {
			if (path === inputFiles.systemsFile) return Promise.resolve(JSON.stringify(systems));
			throw new Error('File not found');
		});
	});

	beforeEach(() => {
		repo.findAll.mockClear();
		kcApiClientIdentityProvidersMock.find.mockClear();
		kcApiClientIdentityProvidersMock.create.mockClear();
		kcApiClientIdentityProvidersMock.update.mockClear();
		kcApiClientIdentityProvidersMock.del.mockClear();
		configService.get.mockClear();
		fsReadFile.mockClear();
	});

	afterAll(() => {
		repo.findAll.mockRestore();
		kcApiClientIdentityProvidersMock.find.mockRestore();
		kcApiClientIdentityProvidersMock.create.mockRestore();
		kcApiClientIdentityProvidersMock.update.mockRestore();
		kcApiClientIdentityProvidersMock.del.mockRestore();
		configService.get.mockRestore();
		fsReadFile.mockRestore();
	});

	it('should read configs from file system in development', async () => {
		const result = await service.configureIdentityProviders(true);
		expect(result).toBeGreaterThan(0);
		expect(repo.findAll).not.toBeCalled();
		expect(fsReadFile).toBeCalled();
	});
	it('should read configs from database in production', async () => {
		const result = await service.configureIdentityProviders(false);
		expect(result).toBeGreaterThan(0);
		expect(repo.findAll).toBeCalled();
		expect(fsReadFile).not.toBeCalled();
	});
	it('should read configs from database per default', async () => {
		const result = await service.configureIdentityProviders();
		expect(result).toBeGreaterThan(0);
		expect(repo.findAll).toBeCalled();
		expect(fsReadFile).not.toBeCalled();
	});

	it('should create a configuration in Keycloak', async () => {
		kcApiClientIdentityProvidersMock.find.mockResolvedValue([]);

		const result = await service.configureIdentityProviders();
		expect(result).toBe(1);
		expect(kcApiClientIdentityProvidersMock.create).toBeCalledTimes(1);
		expect(configService.get).toBeCalled();

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
		configService.get.mockRestore();
	});
});
