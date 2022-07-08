/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { v1 } from 'uuid';
import fs from 'node:fs/promises';
import { IKeycloakSettings, KeycloakSettings } from '../interface/keycloak-settings.interface';
import { KeycloakManagementUc } from './Keycloak-management.uc';
import { KeycloakAdministrationService } from '../keycloak-administration.service';
import { IJsonAccount, IJsonUser, IKeycloakManagementInputFiles, KeycloakManagementInputFiles } from '../interface';

describe('KeycloakManagementUc', () => {
	let module: TestingModule;
	let uc: KeycloakManagementUc;
	let client: KeycloakAdminClient;
	let service: KeycloakAdministrationService;
	let settings: IKeycloakSettings;

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

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				{
					provide: KeycloakManagementInputFiles,
					useValue: {
						accountsFile,
						usersFile,
					} as IKeycloakManagementInputFiles,
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
					useValue: {
						auth: jest.fn().mockImplementation(async (): Promise<void> => {
							if (settings.credentials.username !== adminUser.username) {
								throw new Error();
							}

							return Promise.resolve();
						}),
						setConfig: jest.fn(),
						users: {
							create: jest.fn(),
							del: jest.fn(),
							find: jest
								.fn()
								.mockImplementation((): Promise<UserRepresentation[]> => Promise.resolve([...users, adminUser])),
						},
					},
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
});
