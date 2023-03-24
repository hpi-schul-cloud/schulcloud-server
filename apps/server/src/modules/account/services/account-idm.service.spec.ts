import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { IAccount } from '@shared/domain';
import { NotImplementedException } from '@nestjs/common/exceptions/not-implemented.exception';
import { IdentityManagementService } from '@shared/infra/identity-management';
import { AccountServiceIdm } from './account-idm.service';
import { AccountDto, AccountSaveDto } from './dto';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let identityManagementService: IdentityManagementService;
	let accountIdmService: AccountServiceIdm;

	const mockIdmAccountRefId = 'tecId';
	const mockIdmAccount: IAccount = {
		id: 'id',
		username: 'username',
		email: 'email',
		firstName: 'firstName',
		lastName: 'lastName',
		createdDate: new Date(2020, 1, 1, 0, 0, 0, 0),
		attRefTechnicalId: mockIdmAccountRefId,
		attRefFunctionalIntId: 'fctIntId',
		attRefFunctionalExtId: 'fctExtId',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					load: [
						() => {
							return {
								FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: true,
							};
						},
					],
				}),
			],
			providers: [
				AccountServiceIdm,
				{
					provide: IdentityManagementService,
					useValue: {
						createAccount: jest
							.fn()
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							.mockImplementation((): Promise<string> => Promise.resolve(mockIdmAccount.id)),
						updateAccount: jest
							.fn()
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							.mockImplementation((accountId: string): Promise<string> => Promise.resolve(accountId)),
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						updateAccountPassword: jest
							.fn()
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							.mockImplementation((accountId: string, password: string): Promise<string> => Promise.resolve(accountId)),
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findAccountById: jest
							.fn()
							.mockImplementation(
								(accountId: string): Promise<IAccount> =>
									accountId === mockIdmAccount.id ? Promise.resolve(mockIdmAccount) : Promise.reject()
							),
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findAccountByTecRefId: jest
							.fn()
							.mockImplementation(
								(accountTecRefId: string): Promise<IAccount> =>
									accountTecRefId === mockIdmAccount.attRefTechnicalId
										? Promise.resolve(mockIdmAccount)
										: Promise.reject()
							),
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findAccountByFctIntId: jest
							.fn()
							.mockImplementation(
								(accountFctIntId: string): Promise<IAccount> =>
									accountFctIntId === mockIdmAccount.attRefFunctionalIntId
										? Promise.resolve(mockIdmAccount)
										: Promise.reject()
							),
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						findAccountByUsername: jest
							.fn()
							.mockImplementation(
								(username: string): Promise<IAccount | undefined> =>
									username === mockIdmAccount.username ? Promise.resolve(mockIdmAccount) : Promise.reject()
							),
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						getAllAccounts: jest.fn().mockImplementation((): Promise<IAccount[]> => Promise.resolve([mockIdmAccount])),
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						deleteAccountById: jest
							.fn()
							.mockImplementation((accountId: string): Promise<string> => Promise.resolve(accountId)),
					},
				},
			],
		}).compile();
		accountIdmService = module.get(AccountServiceIdm);
		identityManagementService = module.get(IdentityManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('save', () => {
		it('should update an existing account', async () => {
			const updateSpy = jest.spyOn(identityManagementService, 'updateAccount');
			const createSpy = jest.spyOn(identityManagementService, 'createAccount');

			const mockAccountDto = {
				id: mockIdmAccountRefId,
				username: 'testUserName',
				userId: 'userId',
				systemId: 'systemId',
			};
			const ret = await accountIdmService.save(mockAccountDto);

			expect(updateSpy).toHaveBeenCalled();
			expect(createSpy).not.toHaveBeenCalled();

			expect(ret).toBeDefined();
			expect(ret).toMatchObject<Partial<AccountDto>>({
				id: mockIdmAccount.attRefTechnicalId,
				idmReferenceId: mockIdmAccount.id,
				createdAt: mockIdmAccount.createdDate,
				updatedAt: mockIdmAccount.createdDate,
				username: mockIdmAccount.username,
			});
		});
		it('should update an existing accounts password', async () => {
			const updateSpy = jest.spyOn(identityManagementService, 'updateAccount');
			const updatePasswordSpy = jest.spyOn(identityManagementService, 'updateAccountPassword');

			const mockAccountDto: AccountSaveDto = {
				id: mockIdmAccountRefId,
				username: 'testUserName',
				userId: 'userId',
				systemId: 'systemId',
				password: 'password',
			};
			const ret = await accountIdmService.save(mockAccountDto);

			expect(updateSpy).toHaveBeenCalled();
			expect(updatePasswordSpy).toHaveBeenCalled();
			expect(ret).toBeDefined();
		});
		it('should create a new account', async () => {
			const updateSpy = jest.spyOn(identityManagementService, 'updateAccount');
			const createSpy = jest.spyOn(identityManagementService, 'createAccount');

			const mockAccountDto = { username: 'testUserName', id: undefined, userId: 'userId', systemId: 'systemId' };
			const ret = await accountIdmService.save(mockAccountDto);

			expect(updateSpy).not.toHaveBeenCalled();
			expect(createSpy).toHaveBeenCalled();

			expect(ret).toBeDefined();
			expect(ret).toMatchObject<Partial<AccountDto>>({
				id: mockIdmAccount.attRefTechnicalId,
				idmReferenceId: mockIdmAccount.id,
				createdAt: mockIdmAccount.createdDate,
				updatedAt: mockIdmAccount.createdDate,
				username: mockIdmAccount.username,
			});
		});
		it('should create a new account on update error', async () => {
			const findSpy = jest.spyOn(identityManagementService, 'findAccountByTecRefId');
			const createSpy = jest.spyOn(identityManagementService, 'createAccount');

			const mockAccountDto = {
				id: mockIdmAccountRefId,
				username: 'testUserName',
				userId: 'userId',
				systemId: 'systemId',
			};

			findSpy.mockRejectedValueOnce(new Error('Update Failed'));
			const ret = await accountIdmService.save(mockAccountDto);

			expect(createSpy).toHaveBeenCalled();

			expect(ret).toBeDefined();
			expect(ret).toMatchObject<Partial<AccountDto>>({
				id: mockIdmAccount.attRefTechnicalId,
				idmReferenceId: mockIdmAccount.id,
				createdAt: mockIdmAccount.createdDate,
				updatedAt: mockIdmAccount.createdDate,
				username: mockIdmAccount.username,
			});
		});
	});

	describe('updateUsername', () => {
		it('should map result correctly', async () => {
			const ret = await accountIdmService.updateUsername(mockIdmAccountRefId, 'any');

			expect(ret).toBeDefined();
			expect(ret).toMatchObject<Partial<AccountDto>>({
				id: mockIdmAccount.attRefTechnicalId,
				idmReferenceId: mockIdmAccount.id,
				createdAt: mockIdmAccount.createdDate,
				updatedAt: mockIdmAccount.createdDate,
				username: mockIdmAccount.username,
			});
		});
	});

	describe('updatePassword', () => {
		it('should map result correctly', async () => {
			const ret = await accountIdmService.updatePassword(mockIdmAccountRefId, 'any');

			expect(ret).toBeDefined();
			expect(ret).toMatchObject<Partial<AccountDto>>({
				id: mockIdmAccount.attRefTechnicalId,
				idmReferenceId: mockIdmAccount.id,
				createdAt: mockIdmAccount.createdDate,
				updatedAt: mockIdmAccount.createdDate,
				username: mockIdmAccount.username,
			});
		});
	});

	describe('delete', () => {
		it('should delete account via repo', async () => {
			const deleteSpy = jest.spyOn(identityManagementService, 'deleteAccountById');
			await expect(accountIdmService.delete(mockIdmAccountRefId)).resolves.not.toThrow();
			expect(deleteSpy).toHaveBeenCalledWith(mockIdmAccount.id);
		});
	});

	describe('deleteByUserId', () => {
		it('should delete the account with given user id via repo', async () => {
			const deleteSpy = jest.spyOn(identityManagementService, 'deleteAccountById');
			await accountIdmService.deleteByUserId(mockIdmAccount.attRefFunctionalIntId ?? '');
			expect(deleteSpy).toHaveBeenCalledWith(mockIdmAccount.id);
		});
	});

	describe('Not implemented method', () => {
		it('findById should throw', async () => {
			await expect(accountIdmService.findById('id')).rejects.toThrow(NotImplementedException);
		});

		it('findMultipleByUserId should throw', async () => {
			await expect(accountIdmService.findMultipleByUserId(['id1', 'id2'])).rejects.toThrow(NotImplementedException);
		});

		it('findByUserId should throw', async () => {
			await expect(accountIdmService.findByUserId('id')).rejects.toThrow(NotImplementedException);
		});

		it('findByUserIdOrFail should throw', async () => {
			await expect(accountIdmService.findByUserIdOrFail('id')).rejects.toThrow(NotImplementedException);
		});

		it('findByUsernameAndSystemId should throw', async () => {
			await expect(accountIdmService.findByUsernameAndSystemId('id1', 'id2')).rejects.toThrow(NotImplementedException);
		});

		it('searchByUsernamePartialMatch should throw', async () => {
			await expect(accountIdmService.searchByUsernamePartialMatch('username', 0, 10)).rejects.toThrow(
				NotImplementedException
			);
		});

		it('searchByUsernameExactMatch should throw', async () => {
			await expect(accountIdmService.searchByUsernameExactMatch('username')).rejects.toThrow(NotImplementedException);
		});

		it('updateLastTriedFailedLogin should throw', async () => {
			await expect(accountIdmService.updateLastTriedFailedLogin('id', new Date())).rejects.toThrow(
				NotImplementedException
			);
		});
	});
});
