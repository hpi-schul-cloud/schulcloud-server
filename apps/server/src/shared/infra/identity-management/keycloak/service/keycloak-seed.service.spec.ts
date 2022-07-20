/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { v1 } from 'uuid';
import { createMock } from '@golevelup/ts-jest';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { IJsonAccount, IJsonUser, IKeycloakManagementInputFiles, KeycloakManagementInputFiles } from '../interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { KeycloakSeedService } from './keycloak-seed.service';

const accountsFile = 'accounts.json';
const usersFile = 'users.json';
let jsonAccounts: IJsonAccount[];
let jsonUsers: IJsonUser[];
jest.mock('node:fs/promises', () => ({
	readFile: jest.fn().mockImplementation((path: string) => {
		if (path.toString() === accountsFile) {
			return Promise.resolve(JSON.stringify(jsonAccounts));
		}
		if (path.toString() === usersFile) {
			return Promise.resolve(JSON.stringify(jsonUsers));
		}
		throw new Error();
	}),
}));

describe('KeycloakSeedService', () => {
	let module: TestingModule;
	let serviceUnderTest: KeycloakSeedService;

	const kcAdminClient = createMock<KeycloakAdminClient>();
	const kcApiUsersMock = createMock<Users>();
	const adminUsername = 'admin';

	let validAccountsNoDuplicates: IJsonAccount[];
	let validAccounts: IJsonAccount[];

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
				{
					provide: KeycloakManagementInputFiles,
					useValue: inputFiles,
				},
				KeycloakSeedService,
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
			],
		}).compile();
		serviceUnderTest = module.get(KeycloakSeedService);

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

		jsonAccounts = [...validAccounts, { _id: { $oid: '4' }, username: 'NoUser', password: '', userId: { $oid: '99' } }];

		jsonUsers = [
			{ _id: { $oid: '1' }, firstName: users[0].firstName ?? missingFirstName, lastName: '', email: '' },
			{ _id: { $oid: '2' }, firstName: users[1].firstName ?? missingFirstName, lastName: '', email: '' },
			{ _id: { $oid: '3' }, firstName: users[2].firstName ?? missingFirstName, lastName: '', email: '' },
			{ _id: { $oid: '4' }, firstName: 'NoAccount', lastName: '', email: '' },
		];
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
		// fsReadMock.mockRestore();
	});

	describe('createOrUpdateIdmAccount', () => {
		it('should create successfully', async () => {
			const idmUser = {
				username: jsonAccounts[0].username,
				firstName: jsonUsers[0].firstName,
				lastName: jsonUsers[0].lastName,
				email: jsonUsers[0].email,
				enabled: true,
				credentials: [
					{
						type: 'password',
						secretData: `{"value": "${jsonAccounts[0].password}", "salt": "", "additionalParameters": {}}`,
						credentialData: '{ "hashIterations": 10, "algorithm": "bcrypt", "additionalParameters": {}}',
					},
				],
			};
			kcAdminClient.users.find = jest.fn().mockResolvedValue([]);
			kcAdminClient.users.update = jest.fn().mockResolvedValue(null);
			kcAdminClient.users.create = jest.fn().mockResolvedValue(null);
			const result = await serviceUnderTest.createOrUpdateIdmAccount(jsonAccounts[0], jsonUsers[0]);
			expect(result).toBe(true);
			expect(kcAdminClient.users.create).toBeCalledTimes(1);
			expect(kcAdminClient.users.create).toBeCalledWith(idmUser);
			expect(kcAdminClient.users.update).toBeCalledTimes(0);
		});
		it('should update successfully', async () => {
			const idmUser = {
				username: jsonAccounts[0].username,
				firstName: jsonUsers[0].firstName,
				lastName: jsonUsers[0].lastName,
				email: jsonUsers[0].email,
				enabled: true,
				credentials: [
					{
						type: 'password',
						secretData: `{"value": "${jsonAccounts[0].password}", "salt": "", "additionalParameters": {}}`,
						credentialData: '{ "hashIterations": 10, "algorithm": "bcrypt", "additionalParameters": {}}',
					},
				],
			};
			kcAdminClient.users.find = jest.fn().mockResolvedValue([users[0]]);
			kcAdminClient.users.update = jest.fn().mockResolvedValue(null);
			kcAdminClient.users.create = jest.fn().mockResolvedValue(null);
			const result = await serviceUnderTest.createOrUpdateIdmAccount(jsonAccounts[0], jsonUsers[0]);
			expect(result).toBe(true);
			expect(kcAdminClient.users.create).toBeCalledTimes(0);
			expect(kcAdminClient.users.update).toBeCalledWith({ id: users[0].id }, idmUser);
			expect(kcAdminClient.users.update).toBeCalledTimes(1);
		});

		it('should not create/update if data is invalid', async () => {
			kcAdminClient.users.find = jest.fn().mockResolvedValue([users[0], users[0]]);
			kcAdminClient.users.update = jest.fn().mockResolvedValue(null);
			kcAdminClient.users.create = jest.fn().mockResolvedValue(null);
			const result = await serviceUnderTest.createOrUpdateIdmAccount(jsonAccounts[0], jsonUsers[0]);
			expect(result).toBe(false);
			expect(kcAdminClient.users.create).toBeCalledTimes(0);
			expect(kcAdminClient.users.update).toBeCalledTimes(0);
		});
	});

	describe('loadAccounts', () => {
		it('should load successfully', async () => {
			const result = await serviceUnderTest.loadAccounts();
			expect(result.length).toBeGreaterThan(0);
		});
	});
	describe('loadUsers', () => {
		it('should load successfully', async () => {
			const result = await serviceUnderTest.loadUsers();
			expect(result.length).toBeGreaterThan(0);
		});
	});
});
