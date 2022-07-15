/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { v1 } from 'uuid';
import fs from 'node:fs/promises';
import { EnvType, SysType } from '@shared/infra/identity-management';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { SystemRepo } from '@shared/repo';
import { System } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { IdentityProviders } from '@keycloak/keycloak-admin-client/lib/resources/identityProviders';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { AuthenticationManagement } from '@keycloak/keycloak-admin-client/lib/resources/authenticationManagement';
import AuthenticationFlowRepresentation from '@keycloak/keycloak-admin-client/lib/defs/authenticationFlowRepresentation';
import { randomUUID } from 'crypto';
import {
	IConfigureOptions,
	IJsonAccount,
	IJsonUser,
	IKeycloakManagementInputFiles,
	KeycloakManagementInputFiles,
} from '../interface';
import { KeycloakAdministrationService } from '../keycloak-administration.service';
import { KeycloakManagementUc } from './Keycloak-management.uc';
import { IKeycloakSettings, KeycloakSettings } from '../interface/keycloak-settings.interface';

describe('KeycloakManagementUc', () => {
	let module: TestingModule;
	let uc: KeycloakManagementUc;
	let client: DeepMocked<KeycloakAdminClient>;
	let service: DeepMocked<KeycloakAdministrationService>;
	let repo: DeepMocked<SystemRepo>;
	let settings: IKeycloakSettings;

	const clientIdentityProviders = createMock<IdentityProviders>();
	const clientAuthenticationManagement = createMock<AuthenticationManagement>();
	const adminUsername = 'admin';
	const accountsFile = 'accounts.json';
	const usersFile = 'users.json';

	let validAccounts: IJsonAccount[];
	let jsonAccounts: IJsonAccount[];
	let jsonUsers: IJsonUser[];

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
	const users: UserRepresentation[] = [
		{
			id: v1(),
			firstName: 'John',
			lastName: 'Doe',
			email: 'john.doe@email.tld',
		},
		{
			id: v1(),
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'jane.doe@email.tld',
		},
	];
	const inputFiles: IKeycloakManagementInputFiles = {
		accountsFile: 'accounts.json',
		usersFile: 'users.json',
		systemsFile: 'systems.json',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: KeycloakManagementInputFiles,
					useValue: inputFiles,
				},
				KeycloakManagementUc,
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest.fn().mockImplementation(async (): Promise<KeycloakAdminClient> => {
							return Promise.resolve(client);
						}),
						testKcConnection: jest.fn().mockResolvedValue(true),
						getAdminUser: jest.fn().mockReturnValue(adminUser.username),
						setPasswordPolicy: jest.fn(),
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
						users: {
							create: async (): Promise<void> => Promise.resolve(),
							del: async (): Promise<void> => Promise.resolve(),
							find: async (): Promise<UserRepresentation[]> => Promise.resolve([adminUser, ...users]),
						},
						identityProviders: clientIdentityProviders,
						authenticationManagement: clientAuthenticationManagement,
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
			],
		}).compile();
		uc = module.get(KeycloakManagementUc);
		client = module.get(KeycloakAdminClient);
		service = module.get(KeycloakAdministrationService);
		settings = module.get(KeycloakSettings);
		repo = module.get(SystemRepo);
	});

	describe('check', () => {
		it('should return connection status', async () => {
			let expected = true;
			jest.spyOn(service, 'testKcConnection').mockResolvedValue(expected);
			await expect(uc.check()).resolves.toBe(expected);

			expected = false;
			jest.spyOn(service, 'testKcConnection').mockResolvedValue(expected);
			await expect(uc.check()).resolves.toBe(expected);
		});
	});

	describe('clean', () => {
		it('should clean successfully', async () => {
			const result = await uc.clean();
			expect(result).toBeGreaterThan(0);
		});
		it('should clean all users, but the admin', async () => {
			const deleteSpy = jest.spyOn(client.users, 'del');
			await uc.clean();

			users.forEach((user) => {
				expect(deleteSpy).toHaveBeenCalledWith(expect.objectContaining({ id: user.id }));
			});
			expect(deleteSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: adminUser.id }));
		});
	});

	describe('seed', () => {
		let fsReadMock: jest.SpyInstance;
		beforeAll(() => {
			validAccounts = [
				{ _id: { $oid: '1' }, username: 'First', password: '', userId: { $oid: '1' } },
				{ _id: { $oid: '2' }, username: 'Second', password: '', userId: { $oid: '2' } },
			];

			jsonAccounts = [
				...validAccounts,
				{ _id: { $oid: '3' }, username: 'NoUser', password: '', userId: { $oid: '99' } },
			];

			jsonUsers = [
				{ _id: { $oid: '1' }, firstName: 'First', lastName: '', email: '' },
				{ _id: { $oid: '2' }, firstName: 'Second', lastName: '', email: '' },
				{ _id: { $oid: '3' }, firstName: 'NoAccount', lastName: '', email: '' },
			];

			fsReadMock = jest.spyOn(fs, 'readFile').mockImplementation((path) => {
				if (path.toString() === accountsFile) {
					return Promise.resolve(JSON.stringify(jsonAccounts));
				}
				if (path.toString() === usersFile) {
					return Promise.resolve(JSON.stringify(jsonUsers));
				}
				throw new Error();
			});
		});

		afterAll(() => {
			fsReadMock.mockRestore();
		});

		it('should seed successfully', async () => {
			const result = await uc.seed();
			expect(result).toBeGreaterThan(0);
		});
		it('should seed all users from a backup JSON with corresponding account', async () => {
			const createSpy = jest.spyOn(client.users, 'create');
			const result = await uc.seed();
			validAccounts.forEach((account) => {
				expect(createSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						username: account.username,
					})
				);
			});
			expect(result).toBe(validAccounts.length);
		});
	});

	describe('configureIdentityProviders', () => {
		const devConfig: IConfigureOptions = { envType: EnvType.DEV };
		const prodConfig: IConfigureOptions = { envType: EnvType.PROD };
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
		let configurationGet: jest.SpyInstance;
		let fsReadFile: jest.SpyInstance;

		beforeEach(() => {
			repo.findAll.mockResolvedValue(systems);
			clientIdentityProviders.find.mockResolvedValue(idps);
			clientIdentityProviders.create.mockResolvedValue({ id: '' });
			clientIdentityProviders.update.mockResolvedValue();
			clientIdentityProviders.del.mockResolvedValue();
			configurationGet = jest.spyOn(Configuration, 'get').mockImplementation((key) => key);
			fsReadFile = jest.spyOn(fs, 'readFile').mockImplementation((path) => {
				if (path === inputFiles.systemsFile) return Promise.resolve(JSON.stringify(systems));
				throw new Error('File not found');
			});
		});

		afterEach(() => {
			repo.findAll.mockRestore();
			clientIdentityProviders.find.mockRestore();
			clientIdentityProviders.create.mockRestore();
			clientIdentityProviders.update.mockRestore();
			clientIdentityProviders.del.mockRestore();
			configurationGet.mockRestore();
			fsReadFile.mockRestore();
		});

		it('should read configs from file system in development', async () => {
			const result = await uc.configureIdentityProviders(devConfig);
			expect(result).toBeGreaterThan(0);
			expect(repo.findAll).not.toBeCalled();
			expect(fsReadFile).toBeCalled();
		});
		it('should read configs from database in production', async () => {
			const result = await uc.configureIdentityProviders(prodConfig);
			expect(result).toBeGreaterThan(0);
			expect(repo.findAll).toBeCalled();
			expect(fsReadFile).not.toBeCalled();
		});
		it('should throw if environment is unknown', async () => {
			await expect(
				uc.configureIdentityProviders({
					envType: 'unknown' as EnvType,
				})
			).rejects.toThrow();
		});
		it('should create a configuration in Keycloak', async () => {
			clientIdentityProviders.find.mockResolvedValue([]);

			const result = await uc.configureIdentityProviders(prodConfig);
			expect(result).toBe(1);
			expect(clientIdentityProviders.create).toBeCalledTimes(1);
			expect(configurationGet).toBeCalled();

			clientIdentityProviders.find.mockRestore();
		});
		it('should update a configuration in Keycloak', async () => {
			const result = await uc.configureIdentityProviders(prodConfig);
			expect(result).toBe(1);
			expect(clientIdentityProviders.update).toBeCalledTimes(1);
		});
		it('should delete a new configuration in Keycloak', async () => {
			repo.findAll.mockResolvedValue([]);

			const result = await uc.configureIdentityProviders(prodConfig);
			expect(result).toBe(1);
			expect(clientIdentityProviders.del).toBeCalledTimes(1);

			repo.findAll.mockRestore();
		});
	});

	describe('configureAuthenticationFlows', () => {
		const directAuthFlow: AuthenticationFlowRepresentation = {
			id: randomUUID().toString(),
			alias: 'Direct Broker Flow',
			description: 'First broker login which automatically creates or maps accounts.',
			providerId: 'basic-flow',
			topLevel: true,
			builtIn: false,
			authenticationExecutions: [
				{
					authenticator: 'idp-create-user-if-unique',
					autheticatorFlow: false,
					requirement: 'ALTERNATIVE',
					priority: 0,
					userSetupAllowed: false,
				},
				{
					authenticator: 'idp-auto-link',
					autheticatorFlow: false,
					requirement: 'ALTERNATIVE',
					priority: 1,
					userSetupAllowed: false,
				},
			],
		};

		beforeEach(() => {
			clientAuthenticationManagement.createFlow.mockResolvedValue({});
			clientAuthenticationManagement.getFlows.mockResolvedValue([]);
			clientAuthenticationManagement.deleteFlow.mockResolvedValue({});
		});

		afterEach(() => {
			clientAuthenticationManagement.createFlow.mockRestore();
			clientAuthenticationManagement.getFlows.mockRestore();
			clientAuthenticationManagement.deleteFlow.mockRestore();
		});

		it('should create new authentication flow', async () => {
			const result = await uc.configureAuthenticationFlows();
			expect(result).toBe(1);
			expect(clientAuthenticationManagement.createFlow).toBeCalled();
			expect(clientAuthenticationManagement.deleteFlow).not.toBeCalled();
		});
		it('should delete and create authentication flow', async () => {
			clientAuthenticationManagement.getFlows.mockResolvedValue([directAuthFlow]);

			const result = await uc.configureAuthenticationFlows();
			expect(result).toBe(2);
			expect(clientAuthenticationManagement.createFlow).toBeCalled();
			expect(clientAuthenticationManagement.deleteFlow).toBeCalled();

			clientAuthenticationManagement.getFlows.mockRestore();
		});
	});

	describe('setPasswordPolicy', () => {
		it('should call service', async () => {
			await uc.setPasswordPolicy();
			expect(service.setPasswordPolicy).toBeCalled();
		});
	});
});
