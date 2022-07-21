/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { v1 } from 'uuid';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { KeycloakAdministrationService } from '../service/keycloak-administration.service';
import { KeycloakManagementUc } from './Keycloak-management.uc';
import { KeycloakConfigurationService } from '../service/keycloak-configuration.service';
import { KeycloakSeedService } from '../service/keycloak-seed.service';
import fs from 'node:fs/promises';
import { SysType } from '@shared/infra/identity-management';
import { System } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import { ConfigService } from '@nestjs/config';
import { NodeEnvType } from '@src/server.config';
import { IJsonAccount, IJsonUser, IKeycloakManagementInputFiles } from '../interface';

describe('KeycloakManagementUc', () => {
	let module: TestingModule;
	let uc: KeycloakManagementUc;
	const kcAdminClient = createMock<KeycloakAdminClient>();
	let keycloakAdministrationService: DeepMocked<KeycloakAdministrationService>;
	let keycloakConfigurationService: DeepMocked<KeycloakConfigurationService>;
	let keycloakSeedService: DeepMocked<KeycloakSeedService>;

	const kcApiUsersMock = createMock<Users>();
	const adminUsername = 'admin';

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
				KeycloakManagementUc,
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest.fn().mockImplementation(async (): Promise<KeycloakAdminClient> => {
							return Promise.resolve(kcAdminClient);
						}),
						testKcConnection: jest.fn().mockResolvedValue(true),
						getAdminUser: jest.fn().mockReturnValue(adminUser.username),
					},
				},
				{
					provide: KeycloakConfigurationService,
					useValue: {
						configureIdentityProviders: jest.fn().mockImplementation(async (): Promise<number> => {
							return Promise.resolve(3);
						}),
					},
				},
				{
					provide: KeycloakSeedService,
					useValue: {
						createOrUpdateIdmAccount: jest.fn().mockImplementation(async (account, user): Promise<boolean> => {
							return Promise.resolve(true);
						}),
						loadAccounts: jest.fn().mockImplementation(async (): Promise<number> => {
							return Promise.resolve(3);
						}),
						loadUsers: jest.fn().mockImplementation(async (): Promise<number> => {
							return Promise.resolve(3);
						}),
					},
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();
		uc = module.get(KeycloakManagementUc);
		keycloakAdministrationService = module.get(KeycloakAdministrationService);
		keycloakConfigurationService = module.get(KeycloakConfigurationService);
		keycloakSeedService = module.get(KeycloakSeedService);
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
			jest.spyOn(keycloakAdministrationService, 'testKcConnection').mockResolvedValue(expected);
			await expect(uc.check()).resolves.toBe(expected);

			expected = false;
			jest.spyOn(keycloakAdministrationService, 'testKcConnection').mockResolvedValue(expected);
			await expect(uc.check()).resolves.toBe(expected);
		});
	});

	describe('clean', () => {
		it('should clean successfully', async () => {
			kcAdminClient.users.find = jest.fn().mockResolvedValue([...users, adminUser]);
			kcAdminClient.users.del = jest.fn();
			const result = await uc.clean();
			expect(result).toBeGreaterThan(0);
			expect(kcAdminClient.users.del).toBeCalledTimes(users.length);
		});
		it('should clean all users, but the admin', async () => {
			kcAdminClient.users.find = jest.fn().mockResolvedValue([...users, adminUser]);
			kcAdminClient.users.del = jest.fn();
			const deleteSpy = jest.spyOn(kcAdminClient.users, 'del');
			await uc.clean();

			users.forEach((user) => {
				expect(deleteSpy).toHaveBeenCalledWith(expect.objectContaining({ id: user.id }));
			});
			expect(deleteSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: adminUser.id }));
		});
	});

	describe('seed', () => {
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

			keycloakSeedService.loadUsers.mockResolvedValue(jsonUsers);
			keycloakSeedService.loadAccounts.mockResolvedValue(jsonAccounts);
		});

		afterAll(() => {});

		it('should seed successfully', async () => {
			const result = await uc.seed();
			expect(result).toBeGreaterThan(0);
		});

		it('should seed all users from a backup JSON with corresponding account, user/account with id dont match and are not created', async () => {
			const result = await uc.seed();
			for (let i = 0; i < validAccounts.length; i += 1) {
				expect(keycloakSeedService.createOrUpdateIdmAccount).toHaveBeenCalledWith(jsonAccounts[i], jsonUsers[i]);
			}
			expect(result).toBe(validAccounts.length);
		});
	});

	describe('configureIdentityProviders', () => {
		it('should call service', async () => {
			await uc.configureIdentityProviders();
			expect(keycloakConfigurationService.configureIdentityProviders).toBeCalledTimes(1);
		});
	});
});
