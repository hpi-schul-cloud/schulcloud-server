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
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
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

	const kcApiClientIdentityProvidersMock = createMock<IdentityProviders>();
	const kcApiUsersMock = createMock<Users>();
	const kcApiAuthenticationManagementMock = createMock<AuthenticationManagement>();
	const adminUsername = 'admin';
	const accountsFile = 'accounts.json';
	const usersFile = 'users.json';

	let validAccountsNoDuplicates: IJsonAccount[];
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
			username: 'john.doe',
		},
		{
			id: v1(),
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'jane.doe@email.tld',
			username: 'jane.doe',
		},
		{
			id: v1(),
			firstName: 'First',
			lastName: 'Duplicate',
			email: 'first.duplicate@email.tld',
			username: 'notUnique',
		},
		{
			id: v1(),
			firstName: 'Second',
			lastName: 'Duplicate',
			email: 'second.duplicate@email.tld',
			username: 'notUnique',
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
						users: kcApiUsersMock,
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
			],
		}).compile();
		uc = module.get(KeycloakManagementUc);
		client = module.get(KeycloakAdminClient);
		service = module.get(KeycloakAdministrationService);
		settings = module.get(KeycloakSettings);
		repo = module.get(SystemRepo);
	});

	beforeEach(() => {
		kcApiUsersMock.create.mockResolvedValue({ id: '' });
		kcApiUsersMock.del.mockImplementation(async (): Promise<void> => Promise.resolve());
		kcApiUsersMock.find.mockImplementation(async (arg): Promise<UserRepresentation[]> => {
			if (arg?.username) {
				return Promise.resolve([]);
			}
			const userArray = [adminUser, ...users];
			return Promise.resolve(userArray);
		});
	});

	afterEach(() => {
		kcApiUsersMock.create.mockRestore();
		kcApiUsersMock.del.mockRestore();
		kcApiUsersMock.find.mockRestore();
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
			const missingUsername = 'missingUsername';
			const missingFirstName = 'missingFirstName';

			validAccountsNoDuplicates = [
				{ _id: { $oid: '1' }, username: users[0].username ?? missingUsername, password: '', userId: { $oid: '1' } },
				{ _id: { $oid: '2' }, username: users[1].username ?? missingUsername, password: '', userId: { $oid: '2' } },
			];

			validAccounts = [
				...validAccountsNoDuplicates,
				{ _id: { $oid: '3' }, username: users[2].username ?? missingUsername, password: '', userId: { $oid: '3' } },
			];

			jsonAccounts = [
				...validAccounts,
				{ _id: { $oid: '4' }, username: 'NoUser', password: '', userId: { $oid: '99' } },
			];

			jsonUsers = [
				{ _id: { $oid: '1' }, firstName: users[0].firstName ?? missingFirstName, lastName: '', email: '' },
				{ _id: { $oid: '2' }, firstName: users[1].firstName ?? missingFirstName, lastName: '', email: '' },
				{ _id: { $oid: '3' }, firstName: users[2].firstName ?? missingFirstName, lastName: '', email: '' },
				{ _id: { $oid: '4' }, firstName: 'NoAccount', lastName: '', email: '' },
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
		it('should update existing users after initial seeding', async () => {
			const createSpy = jest.spyOn(client.users, 'create');
			const updateSpy = jest.spyOn(client.users, 'update');

			const findSpy = jest.spyOn(client.users, 'find');

			// eslint-disable-next-line no-empty-pattern
			findSpy.mockImplementation(async (arg): Promise<UserRepresentation[]> => {
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				const userArray = [adminUser, ...users];
				if (arg?.username) {
					const foundUsers = userArray.filter((user) => user.username === arg.username);
					if (foundUsers.length > 0) {
						return Promise.resolve(foundUsers);
					}
					return Promise.resolve([]);
				}
				return Promise.resolve(userArray);
			});

			const result = await uc.seed();
			expect(result).toBe(validAccountsNoDuplicates.length);

			validAccountsNoDuplicates.forEach((account) => {
				expect(updateSpy).toHaveBeenCalledWith(
					expect.anything(),
					expect.objectContaining({
						username: account.username,
					})
				);
			});
			expect(createSpy).not.toHaveBeenCalled();
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
			kcApiClientIdentityProvidersMock.find.mockResolvedValue(idps);
			kcApiClientIdentityProvidersMock.create.mockResolvedValue({ id: '' });
			kcApiClientIdentityProvidersMock.update.mockResolvedValue();
			kcApiClientIdentityProvidersMock.del.mockResolvedValue();
			configurationGet = jest.spyOn(Configuration, 'get').mockImplementation((key) => key);
			fsReadFile = jest.spyOn(fs, 'readFile').mockImplementation((path) => {
				if (path === inputFiles.systemsFile) return Promise.resolve(JSON.stringify(systems));
				throw new Error('File not found');
			});
		});

		afterEach(() => {
			repo.findAll.mockRestore();
			kcApiClientIdentityProvidersMock.find.mockRestore();
			kcApiClientIdentityProvidersMock.create.mockRestore();
			kcApiClientIdentityProvidersMock.update.mockRestore();
			kcApiClientIdentityProvidersMock.del.mockRestore();
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
			kcApiClientIdentityProvidersMock.find.mockResolvedValue([]);

			const result = await uc.configureIdentityProviders(prodConfig);
			expect(result).toBe(1);
			expect(kcApiClientIdentityProvidersMock.create).toBeCalledTimes(1);
			expect(configurationGet).toBeCalled();

			kcApiClientIdentityProvidersMock.find.mockRestore();
		});
		it('should update a configuration in Keycloak', async () => {
			const result = await uc.configureIdentityProviders(prodConfig);
			expect(result).toBe(1);
			expect(kcApiClientIdentityProvidersMock.update).toBeCalledTimes(1);
		});
		it('should delete a new configuration in Keycloak', async () => {
			repo.findAll.mockResolvedValue([]);

			const result = await uc.configureIdentityProviders(prodConfig);
			expect(result).toBe(1);
			expect(kcApiClientIdentityProvidersMock.del).toBeCalledTimes(1);

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
			kcApiAuthenticationManagementMock.createFlow.mockResolvedValue({});
			kcApiAuthenticationManagementMock.getFlows.mockResolvedValue([]);
			kcApiAuthenticationManagementMock.deleteFlow.mockResolvedValue({});
		});

		afterEach(() => {
			kcApiAuthenticationManagementMock.createFlow.mockRestore();
			kcApiAuthenticationManagementMock.getFlows.mockRestore();
			kcApiAuthenticationManagementMock.deleteFlow.mockRestore();
		});

		it('should create new authentication flow', async () => {
			const result = await uc.configureAuthenticationFlows();
			expect(result).toBe(1);
			expect(kcApiAuthenticationManagementMock.createFlow).toBeCalled();
			expect(kcApiAuthenticationManagementMock.deleteFlow).not.toBeCalled();
		});
		it('should delete and create authentication flow', async () => {
			kcApiAuthenticationManagementMock.getFlows.mockResolvedValue([directAuthFlow]);

			const result = await uc.configureAuthenticationFlows();
			expect(result).toBe(2);
			expect(kcApiAuthenticationManagementMock.createFlow).toBeCalled();
			expect(kcApiAuthenticationManagementMock.deleteFlow).toBeCalled();

			kcApiAuthenticationManagementMock.getFlows.mockRestore();
		});
	});
});
