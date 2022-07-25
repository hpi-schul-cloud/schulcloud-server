import { Test, TestingModule } from '@nestjs/testing';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakIdentityManagementService } from './keycloak-identity-management.service';
import { IdentityManagementService } from '../../identity-management.service';
import { KeycloakSettings } from '../interface/keycloak-settings.interface';
import { KeycloakAdministrationService } from './keycloak-administration.service';

describe('KeycloakIdentityManagement', () => {
	let idm: IdentityManagementService;
	let kcAdminClient: KeycloakAdminClient;

	type MockUser = {
		id: string;
		username: string;
		email?: string;
		firstName?: string;
		lastName?: string;
	};

	const mockedAdminAccount: MockUser = {
		id: '000',
		username: 'admin',
	};

	const mockedAccount1: MockUser = {
		id: 'user-1-id',
		username: 'user-1',
		email: 'user@mail',
		firstName: 'user',
		lastName: '1',
	};

	const mockedAccount2: MockUser = {
		id: 'user-2-id',
		username: 'user-2',
		email: 'another@mail',
		firstName: 'other',
		lastName: '2',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				KeycloakAdministrationService,
				{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
				{
					provide: KeycloakAdminClient,
					useValue: {
						auth: jest.fn(),
						setConfig: jest.fn(),
						users: {
							create: jest.fn(),
							find: jest.fn(),
							findOne: jest.fn(),
							update: jest.fn(),
							resetPassword: jest.fn(),
							del: jest.fn(),
						},
					},
				},
				{
					provide: KeycloakSettings,
					useValue: {
						credentials: {
							username: mockedAdminAccount.username,
						},
					},
				},
			],
		}).compile();
		idm = module.get<IdentityManagementService>(IdentityManagementService);
		kcAdminClient = module.get(KeycloakAdminClient);
	});

	it('should be defined', () => {
		expect(idm).toBeDefined();
	});

	describe('createAccount', () => {
		it('should allow to create an account', async () => {
			const accountId = 'user-1-id';
			const createUserMock = jest.spyOn(kcAdminClient.users, 'create').mockResolvedValue({ id: accountId });
			const resetPasswordMock = jest.spyOn(kcAdminClient.users, 'resetPassword');
			const testAccount = { userName: 'test', email: 'test@test.test' };
			const testAccountPassword = 'test';

			const ret = await idm.createAccount(testAccount, testAccountPassword);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);
			expect(createUserMock).toBeCalledWith(
				expect.objectContaining({ username: testAccount.userName, email: testAccount.email })
			);
			expect(resetPasswordMock).toBeCalledWith(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					credential: expect.objectContaining({ value: testAccountPassword }),
				})
			);
		});

		it('should reject if account create fails', async () => {
			jest.spyOn(kcAdminClient.users, 'create').mockResolvedValueOnce({ id: 'accountId' }).mockRejectedValue('error');
			const resetPasswordMock = jest.spyOn(kcAdminClient.users, 'resetPassword').mockRejectedValue('error');
			const deleteAccountMock = jest.spyOn(kcAdminClient.users, 'del');

			const testAccount = { userName: 'test', email: 'test@test.test' };
			const testAccountPassword = 'test';

			await expect(idm.createAccount(testAccount, testAccountPassword)).rejects.toBeTruthy();
			expect(resetPasswordMock).toHaveBeenCalled();
			expect(deleteAccountMock).toHaveBeenCalled();
			resetPasswordMock.mockClear();
			deleteAccountMock.mockClear();

			await expect(idm.createAccount(testAccount, testAccountPassword)).rejects.toBeTruthy();
			expect(resetPasswordMock).not.toHaveBeenCalled();
			expect(deleteAccountMock).not.toHaveBeenCalled();
		});
	});

	describe('findAccountById', () => {
		it('should find an existing account', async () => {
			jest.spyOn(kcAdminClient.users, 'findOne').mockResolvedValue(mockedAccount1);

			const ret = await idm.findAccountById(mockedAccount1.id);

			expect(ret).not.toBeNull();
			expect(ret).toEqual(
				expect.objectContaining({
					id: mockedAccount1.id,
					userName: mockedAccount1.username,
					email: mockedAccount1.email,
					firstName: mockedAccount1.firstName,
					lastName: mockedAccount1.lastName,
				})
			);
		});

		it('should reject if account does not exist', async () => {
			jest.spyOn(kcAdminClient.users, 'findOne').mockRejectedValue('error');
			await expect(idm.findAccountById('accountId')).rejects.toBeTruthy();

			jest.spyOn(kcAdminClient.users, 'findOne').mockResolvedValue(undefined);
			await expect(idm.findAccountById('accountId')).rejects.toBeTruthy();
		});
	});

	describe('getAllAccounts', () => {
		it('should find all existing accounts', async () => {
			jest.spyOn(kcAdminClient.users, 'find').mockResolvedValue([mockedAccount1, mockedAccount2]);

			const ret = await idm.getAllAccounts();

			expect(ret).not.toBeNull();
			expect(ret).toHaveLength(2);
			expect(ret).toContainEqual(
				expect.objectContaining({
					id: mockedAccount1.id,
					userName: mockedAccount1.username,
					email: mockedAccount1.email,
					firstName: mockedAccount1.firstName,
					lastName: mockedAccount1.lastName,
				})
			);
			expect(ret).toContainEqual(
				expect.objectContaining({
					id: mockedAccount2.id,
					userName: mockedAccount2.username,
					email: mockedAccount2.email,
					firstName: mockedAccount2.firstName,
					lastName: mockedAccount2.lastName,
				})
			);
		});

		it('should reject if loading all accounts failed', async () => {
			jest.spyOn(kcAdminClient.users, 'find').mockRejectedValue('error');

			await expect(idm.getAllAccounts()).rejects.toBeTruthy();
		});
	});

	describe('updateAccount', () => {
		it('should allow to update an existing account', async () => {
			const accountId = 'user-1-id';
			const updateUserMock = jest.spyOn(kcAdminClient.users, 'update').mockResolvedValue();
			const testAccount = { firstName: 'test', email: 'test@test.test' };

			const ret = await idm.updateAccount(accountId, testAccount);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);
			expect(updateUserMock).toBeCalledWith(
				expect.objectContaining({ id: accountId }),
				expect.objectContaining({ firstName: testAccount.firstName, email: testAccount.email })
			);
		});

		it('should reject if account can not be updated', async () => {
			const accountId = 'user-1-id';
			const testAccount = { userName: 'test', email: 'test@test.test' };
			jest.spyOn(kcAdminClient.users, 'update').mockRejectedValue('error');

			await expect(idm.updateAccount(accountId, testAccount)).rejects.toBeTruthy();
		});
	});

	describe('deleteAccountById', () => {
		it('should allow to delete an existing account', async () => {
			const accountId = 'user-1-id';
			jest.spyOn(kcAdminClient.users, 'del').mockResolvedValue();

			const ret = await idm.deleteAccountById(accountId);

			expect(ret).toBe(accountId);
		});

		it('should reject if account can not be deleted', async () => {
			const accountId = 'user-1-id';
			jest.spyOn(kcAdminClient.users, 'del').mockRejectedValue('error');

			await expect(idm.deleteAccountById(accountId)).rejects.toBeTruthy();
		});
	});

	describe('updateAccountPassword', () => {
		it('should allow to update an existing accounts password', async () => {
			const resetPasswordMock = jest.spyOn(kcAdminClient.users, 'resetPassword').mockResolvedValue();
			const accountId = 'user-1-id';
			const testAccountPassword = 'test';

			const ret = await idm.updateAccountPassword(accountId, testAccountPassword);

			expect(ret).not.toBeNull();
			expect(ret).toBe(accountId);

			expect(resetPasswordMock).toBeCalledWith(
				expect.objectContaining({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					credential: expect.objectContaining({ value: testAccountPassword }),
				})
			);
		});

		it('should reject if account password can not be updated', async () => {
			jest.spyOn(kcAdminClient.users, 'resetPassword').mockRejectedValue('error');
			const accountId = 'user-1-id';
			const testAccountPassword = 'test';

			await expect(idm.updateAccountPassword(accountId, testAccountPassword)).rejects.toBeTruthy();
		});
	});
});
