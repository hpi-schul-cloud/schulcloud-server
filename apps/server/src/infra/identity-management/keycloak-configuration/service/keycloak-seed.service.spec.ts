import { LegacyLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { AuthenticationManagement } from '@keycloak/keycloak-admin-client/lib/resources/authenticationManagement';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import { Test, TestingModule } from '@nestjs/testing';
import { v1 } from 'uuid';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '../../keycloak-administration/keycloak-administration.config';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { JsonAccount } from '../interface/json-account.interface';
import { JsonUser } from '../interface/json-user.interface';
import { KEYCLOAK_CONFIGURATION_CONFIG_TOKEN } from '../keycloak-configuration.config';
import { KeycloakSeedService } from './keycloak-seed.service';

const accountsFile = 'accounts.json';
const usersFile = 'users.json';
let jsonAccounts: JsonAccount[];
let jsonUsers: JsonUser[];

jest.mock('node:fs/promises', () => {
	return {
		readFile: jest.fn().mockImplementation((path: string) => {
			if (path.toString() === accountsFile) {
				return Promise.resolve(JSON.stringify(jsonAccounts));
			}
			if (path.toString() === usersFile) {
				return Promise.resolve(JSON.stringify(jsonUsers));
			}
			throw new Error();
		}),
	};
});

describe('KeycloakSeedService', () => {
	let module: TestingModule;
	let serviceUnderTest: KeycloakSeedService;
	let logger: DeepMocked<LegacyLogger>;
	let config: KeycloakAdministrationConfig;

	let infoLogSpy: jest.SpyInstance;
	let errorLogSpy: jest.SpyInstance;

	let kcAdminClient: DeepMocked<KeycloakAdminClient>;
	const kcApiUsersMock = createMock<Users>();
	const kcApiAuthenticationManagementMock = createMock<AuthenticationManagement>();
	const adminUsername = 'admin';

	let validAccountsNoDuplicates: JsonAccount[];
	let validAccounts: JsonAccount[];

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
			attributes: {
				dbcAccountId: 'accId',
				dbcUserId: 'usrId',
				dbcSystemId: 'sysId',
			},
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

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: KEYCLOAK_CONFIGURATION_CONFIG_TOKEN,
					useValue: {
						accountsFile: 'accounts.json',
						usersFile: 'users.json',
						scDomain: 'localhost	',
					},
				},
				KeycloakSeedService,
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest
							.fn()
							.mockImplementation(async (): Promise<KeycloakAdminClient> => Promise.resolve(kcAdminClient)),
						testKcConnection: jest.fn().mockResolvedValue(true),
						getAdminUser: jest.fn().mockReturnValue(adminUser.username),
					},
				},
				{
					provide: KeycloakAdminClient,
					useValue: createMock<KeycloakAdminClient>({
						auth: (): Promise<void> => {
							if (config.credentials.username !== adminUser.username) throw new Error();
							return Promise.resolve();
						},
						setConfig: () => {},
						users: kcApiUsersMock,
						authenticationManagement: kcApiAuthenticationManagementMock,
					}),
				},
				{
					provide: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
					useValue: {
						baseUrl: 'http://localhost:8080',
						realmName: 'master',
						clientId: 'dBildungscloud',
						credentials: {
							username: adminUsername,
							password: 'password',
							grantType: 'password',
							clientId: 'client-id',
						},
					},
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		serviceUnderTest = module.get(KeycloakSeedService);
		kcAdminClient = module.get(KeycloakAdminClient);
		config = module.get<KeycloakAdministrationConfig>(KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN);

		const missingUsername = 'missingUsername';
		const missingFirstName = 'missingFirstName';

		validAccountsNoDuplicates = [
			{
				_id: { $oid: 'accId' },
				username: users[0].username ?? missingUsername,
				password: '',
				userId: { $oid: 'usrId' },
				systemId: 'sysId',
			},
			{ _id: { $oid: '2' }, username: users[1].username ?? missingUsername, password: '', userId: { $oid: '2' } },
		];

		validAccounts = [
			...validAccountsNoDuplicates,
			{ _id: { $oid: '3' }, username: users[2].username ?? missingUsername, password: '', userId: { $oid: '3' } },
		];

		jsonAccounts = [...validAccounts, { _id: { $oid: '4' }, username: 'NoUser', password: '', userId: { $oid: '99' } }];

		jsonUsers = [
			{ _id: { $oid: 'usrId' }, firstName: users[0].firstName ?? missingFirstName, lastName: '', email: '' },
			{ _id: { $oid: '2' }, firstName: users[1].firstName ?? missingFirstName, lastName: '', email: '' },
			{ _id: { $oid: '3' }, firstName: users[2].firstName ?? missingFirstName, lastName: '', email: '' },
			{ _id: { $oid: '4' }, firstName: 'NoAccount', lastName: '', email: '' },
		];
		kcApiUsersMock.create.mockResolvedValue({ id: '' });
		kcApiUsersMock.del.mockImplementation(async (): Promise<void> => Promise.resolve());
		kcApiUsersMock.find
			.mockImplementationOnce(async (arg): Promise<UserRepresentation[]> => {
				if (arg?.username) {
					return Promise.resolve([]);
				}
				const userArray = [adminUser, ...users];
				return Promise.resolve(userArray);
			})
			.mockImplementationOnce(async (arg): Promise<UserRepresentation[]> => {
				if (arg?.username) {
					return Promise.resolve([]);
				}
				return Promise.resolve([]);
			})
			.mockImplementationOnce(async (): Promise<UserRepresentation[]> => {
				const userArray = [adminUser, ...users];
				return Promise.resolve(userArray);
			})
			.mockImplementation(async (): Promise<UserRepresentation[]> => Promise.resolve([]));
		logger = module.get(LegacyLogger);
		infoLogSpy = jest.spyOn(logger, 'log');
		errorLogSpy = jest.spyOn(logger, 'error');
	});

	beforeEach(() => {
		infoLogSpy.mockReset();
		errorLogSpy.mockReset();
		kcApiUsersMock.create.mockClear();
		kcApiUsersMock.del.mockClear();
		kcApiUsersMock.find.mockClear();
	});

	afterAll(() => {
		kcApiUsersMock.create.mockRestore();
		kcApiUsersMock.del.mockRestore();
		kcApiUsersMock.find.mockRestore();
		jest.clearAllMocks();
		jest.resetModules();
	});

	describe('clean', () => {
		it('should clean successfully', async () => {
			const result = await serviceUnderTest.clean();
			expect(result).toBeGreaterThan(0);
		});
		it('should clean all users, but the admin', async () => {
			const deleteSpy = jest.spyOn(kcApiUsersMock, 'del');
			await serviceUnderTest.clean();
			users.forEach((user) => {
				expect(deleteSpy).toHaveBeenCalledWith(expect.objectContaining({ id: user.id }));
			});
			expect(deleteSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: adminUser.id }));
		});
	});

	describe('seed', () => {
		it('should seed successfully', async () => {
			const result = await serviceUnderTest.seed();
			expect(result).toBeGreaterThan(0);
		});
		it('should seed all users from a backup JSON with corresponding account', async () => {
			const createSpy = jest.spyOn(kcAdminClient.users, 'create');
			const result = await serviceUnderTest.seed();
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
			const createSpy = jest.spyOn(kcAdminClient.users, 'create');
			const updateSpy = jest.spyOn(kcAdminClient.users, 'update');

			const findSpy = jest.spyOn(kcAdminClient.users, 'find');

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

			const result = await serviceUnderTest.seed();
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
});
