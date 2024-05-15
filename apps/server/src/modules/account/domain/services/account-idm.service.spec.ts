import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { IdentityManagementOauthService, IdentityManagementService } from '@infra/identity-management';
import { NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { IdmAccount } from '@shared/domain/interface';
import { Logger } from '@src/core/logger';
import { AccountConfig } from '../../account-config';
import { Account, AccountSave } from '..';
import { AccountIdmToDoMapper, AccountIdmToDoMapperDb } from '../../repo/micro-orm/mapper';
import { AccountServiceIdm } from './account-idm.service';

describe('AccountIdmService', () => {
	let module: TestingModule;
	let accountIdmService: AccountServiceIdm;
	let mapper: AccountIdmToDoMapper;
	let idmServiceMock: DeepMocked<IdentityManagementService>;
	let idmOauthServiceMock: DeepMocked<IdentityManagementOauthService>;
	let configServiceMock: DeepMocked<ConfigService>;

	const mockIdmAccountRefId = 'dbcAccountId';
	const mockIdmAccount: IdmAccount = {
		id: 'id',
		username: 'username',
		email: 'email',
		firstName: 'firstName',
		lastName: 'lastName',
		createdDate: new Date(2020, 1, 1, 0, 0, 0, 0),
		attDbcAccountId: mockIdmAccountRefId,
		attDbcUserId: 'attDbcUserId',
		attDbcSystemId: 'attDbcSystemId',
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				AccountServiceIdm,
				{
					provide: AccountIdmToDoMapper,
					useValue: new AccountIdmToDoMapperDb(),
				},
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<AccountConfig, true>>(),
				},
				{
					provide: IdentityManagementOauthService,
					useValue: createMock<IdentityManagementOauthService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		accountIdmService = module.get(AccountServiceIdm);
		mapper = module.get(AccountIdmToDoMapper);
		idmServiceMock = module.get(IdentityManagementService);
		idmOauthServiceMock = module.get(IdentityManagementOauthService);
		configServiceMock = module.get(ConfigService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('save', () => {
		describe('when save an existing account', () => {
			const setup = () => {
				idmServiceMock.createAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccountPassword.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
				idmServiceMock.findAccountByDbcAccountId.mockResolvedValue(mockIdmAccount);
				configServiceMock.get.mockReturnValue(true);

				const updateSpy = jest.spyOn(idmServiceMock, 'updateAccount');
				const createSpy = jest.spyOn(idmServiceMock, 'createAccount');
				const mockAccountSave = {
					id: mockIdmAccountRefId,
					username: 'testUserName',
					userId: 'userId',
					systemId: 'systemId',
				} as AccountSave;

				return { updateSpy, createSpy, mockAccountDto: mockAccountSave };
			};

			it('should update account information', async () => {
				const { updateSpy, createSpy, mockAccountDto } = setup();

				const ret = await accountIdmService.save(mockAccountDto);

				expect(updateSpy).toHaveBeenCalled();
				expect(createSpy).not.toHaveBeenCalled();

				expect(ret).toBeDefined();
				expect(ret).toMatchObject<Partial<Account>>({
					id: mockIdmAccount.attDbcAccountId,
					idmReferenceId: mockIdmAccount.id,
					createdAt: mockIdmAccount.createdDate,
					updatedAt: mockIdmAccount.createdDate,
					username: mockIdmAccount.username,
				});
			});
		});

		describe('when save an existing account', () => {
			const setup = () => {
				idmServiceMock.createAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccountPassword.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
				const updateSpy = jest.spyOn(idmServiceMock, 'updateAccount');
				const updatePasswordSpy = jest.spyOn(idmServiceMock, 'updateAccountPassword');

				const mockAccountSave = {
					id: mockIdmAccountRefId,
					username: 'testUserName',
					userId: 'userId',
					systemId: 'systemId',
					password: 'password',
				} as AccountSave;
				return { updateSpy, updatePasswordSpy, mockAccountDto: mockAccountSave };
			};
			it('should update account password', async () => {
				const { updateSpy, updatePasswordSpy, mockAccountDto } = setup();

				const ret = await accountIdmService.save(mockAccountDto);

				expect(updateSpy).toHaveBeenCalled();
				expect(updatePasswordSpy).toHaveBeenCalled();
				expect(ret).toBeDefined();
			});
		});

		describe('when save not existing account', () => {
			const setup = () => {
				idmServiceMock.createAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccountPassword.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
				const updateSpy = jest.spyOn(idmServiceMock, 'updateAccount');
				const createSpy = jest.spyOn(idmServiceMock, 'createAccount');

				const mockAccountSave = {
					username: 'testUserName',
					id: undefined,
					userId: 'userId',
					systemId: 'systemId',
				} as AccountSave;

				return { updateSpy, createSpy, mockAccountDto: mockAccountSave };
			};
			it('should create a new account', async () => {
				const { updateSpy, createSpy, mockAccountDto } = setup();

				const ret = await accountIdmService.save(mockAccountDto);

				expect(updateSpy).not.toHaveBeenCalled();
				expect(createSpy).toHaveBeenCalled();

				expect(ret).toBeDefined();
				expect(ret).toMatchObject<Partial<Account>>({
					id: mockIdmAccount.attDbcAccountId,
					idmReferenceId: mockIdmAccount.id,
					createdAt: mockIdmAccount.createdDate,
					updatedAt: mockIdmAccount.createdDate,
					username: mockIdmAccount.username,
				});
			});
		});

		describe('when save not existing account', () => {
			const setup = () => {
				idmServiceMock.createAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccount.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.updateAccountPassword.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
				configServiceMock.get.mockReturnValue(false);

				const mockAccountSave = {
					id: mockIdmAccountRefId,
					username: 'testUserName',
					userId: 'userId',
					systemId: 'systemId',
				} as AccountSave;

				return { mockAccountDto: mockAccountSave };
			};
			it('should create a new account on update error', async () => {
				const { mockAccountDto } = setup();

				const ret = await accountIdmService.save(mockAccountDto);

				expect(idmServiceMock.createAccount).toHaveBeenCalled();
				expect(ret).toBeDefined();
				expect(ret).toMatchObject<Partial<Account>>({
					id: mockIdmAccount.attDbcAccountId,
					idmReferenceId: mockIdmAccount.id,
					createdAt: mockIdmAccount.createdDate,
					updatedAt: mockIdmAccount.createdDate,
					username: mockIdmAccount.username,
				});
			});
		});
	});

	describe('updateUsername', () => {
		describe('when update Username', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(true);
				idmServiceMock.findAccountByDbcAccountId.mockResolvedValue(mockIdmAccount);
			};
			it('should map result correctly', async () => {
				setup();
				const ret = await accountIdmService.updateUsername(mockIdmAccountRefId, 'any');

				expect(ret).toBeDefined();
				expect(ret).toMatchObject<Partial<Account>>({
					id: mockIdmAccount.attDbcAccountId,
					idmReferenceId: mockIdmAccount.id,
					createdAt: mockIdmAccount.createdDate,
					updatedAt: mockIdmAccount.createdDate,
					username: mockIdmAccount.username,
				});
			});
		});
	});

	describe('updatePassword', () => {
		describe('when update password', () => {
			const setup = () => {
				configServiceMock.get.mockReturnValue(true);
				idmServiceMock.findAccountByDbcAccountId.mockResolvedValue(mockIdmAccount);
			};
			it('should map result correctly', async () => {
				setup();
				const ret = await accountIdmService.updatePassword(mockIdmAccountRefId, 'any');

				expect(ret).toBeDefined();
				expect(ret).toMatchObject<Partial<Account>>({
					id: mockIdmAccount.attDbcAccountId,
					idmReferenceId: mockIdmAccount.id,
					createdAt: mockIdmAccount.createdDate,
					updatedAt: mockIdmAccount.createdDate,
					username: mockIdmAccount.username,
				});
			});
		});
	});

	describe('validatePassword', () => {
		describe('when validate password', () => {
			const setup = (acceptPassword: boolean) => {
				idmOauthServiceMock.resourceOwnerPasswordGrant.mockResolvedValue(
					acceptPassword ? '{ "alg": "HS256", "typ": "JWT" }' : undefined
				);
			};
			it('should validate password by checking JWT', async () => {
				setup(true);
				const ret = await accountIdmService.validatePassword(
					{ username: 'username' } as unknown as Account,
					'password'
				);
				expect(ret).toBe(true);
			});
			it('should report wrong password, i. e. non successful JWT creation', async () => {
				setup(false);
				const ret = await accountIdmService.validatePassword(
					{ username: 'username' } as unknown as Account,
					'password'
				);
				expect(ret).toBe(false);
			});
		});
	});

	describe('delete', () => {
		describe('when deleting existing account', () => {
			const setup = () => {
				idmServiceMock.deleteAccountById.mockResolvedValue(mockIdmAccount.id);
				idmServiceMock.findAccountByDbcAccountId.mockResolvedValue(mockIdmAccount);
				configServiceMock.get.mockReturnValueOnce(true);
			};

			it('should delete account via idm', async () => {
				setup();
				await expect(accountIdmService.delete(mockIdmAccountRefId)).resolves.not.toThrow();
				expect(idmServiceMock.deleteAccountById).toHaveBeenCalledWith(mockIdmAccount.id);
			});
		});

		describe('when deleting non existing account', () => {
			const setup = () => {
				idmServiceMock.deleteAccountById.mockResolvedValue(mockIdmAccount.id);
				configServiceMock.get.mockReturnValueOnce(false);
			};

			it('should throw account not found error', async () => {
				setup();
				await expect(accountIdmService.delete(mockIdmAccountRefId)).rejects.toThrow();
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('when deleting an account by user id', () => {
			const setup = () => {
				idmServiceMock.findAccountByDbcUserId.mockResolvedValue(mockIdmAccount);
				const deleteSpy = jest.spyOn(idmServiceMock, 'deleteAccountById');
				return { deleteSpy };
			};

			it('should delete the account with given user id via repo', async () => {
				const { deleteSpy } = setup();

				await accountIdmService.deleteByUserId(mockIdmAccount.attDbcUserId ?? '');
				expect(deleteSpy).toHaveBeenCalledWith(mockIdmAccount.id);
			});
		});
	});

	describe('findById', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.findById(mockIdmAccountRefId);
				expect(result).toStrictEqual<Account>(mapper.mapToDo(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountById.mockRejectedValue(new Error());
			};

			it('should throw account not found', async () => {
				setup();
				await expect(accountIdmService.findById('notExistingId')).rejects.toThrow();
			});
		});
	});

	describe('findMultipleByUserId', () => {
		describe('when finding accounts', () => {
			const setup = () => {
				const accounts = [mockIdmAccount];
				idmServiceMock.findAccountByDbcUserId.mockImplementation(() => {
					const element = accounts.pop() as IdmAccount;
					if (element) {
						return Promise.resolve(element);
					}
					return Promise.reject(new Error());
				});
			};

			it('should return the accounts', async () => {
				setup();
				const result = await accountIdmService.findMultipleByUserId(['id', 'id1', 'id2']);
				expect(result).toStrictEqual<Account[]>([mapper.mapToDo(mockIdmAccount)]);
			});
		});
	});

	describe('findByUserId', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByDbcUserId.mockResolvedValue(mockIdmAccount);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.findByUserId(mockIdmAccount.attDbcUserId ?? '');
				expect(result).toStrictEqual<Account>(mapper.mapToDo(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByDbcUserId.mockResolvedValue(undefined as unknown as IdmAccount);
			};

			it('should return null', async () => {
				setup();
				const result = await accountIdmService.findByUserId('notExistingId');
				expect(result).toBeNull();
			});
		});
	});

	describe('findByUserIdOrFail', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByDbcUserId.mockResolvedValue(mockIdmAccount);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.findByUserIdOrFail(mockIdmAccountRefId);
				expect(result).toStrictEqual<Account>(mapper.mapToDo(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByDbcUserId.mockResolvedValue(undefined as unknown as IdmAccount);
			};

			it('should throw account not found', async () => {
				setup();
				await expect(accountIdmService.findByUserIdOrFail('notExistingId')).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('findByUsernameAndSystemId', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[mockIdmAccount], 1]);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.findByUsernameAndSystemId('username', 'attDbcSystemId');
				expect(result).toStrictEqual<Account>(mapper.mapToDo(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[], 0]);
			};

			it('should return null', async () => {
				setup();
				const result = await accountIdmService.findByUsernameAndSystemId('username', 'systemId');
				expect(result).toBeNull();
			});
		});
	});

	describe('findByUsernamePartialMatch', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[mockIdmAccount], 1]);
			};

			it('should return the account', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernamePartialMatch('username', 0, 10);
				expect(result).toStrictEqual<Account[]>([mapper.mapToDo(mockIdmAccount)]);
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[], 0]);
			};

			it('should return an empty list', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernamePartialMatch('username', 0, 10);
				expect(result).toStrictEqual<Account[]>([]);
			});
		});
	});

	describe('findByUsernameExactMatch', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[mockIdmAccount], 1]);
			};

			it('should return the account', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernameExactMatch('username');
				expect(result).toStrictEqual<Account[]>([mapper.mapToDo(mockIdmAccount)]);
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[], 0]);
			};

			it('should return an empty list', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernameExactMatch('username');
				expect(result).toStrictEqual<Account[]>([]);
			});
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		describe('when updating the last tried failed login', () => {
			const setup = () => {
				idmServiceMock.findAccountByDbcAccountId.mockResolvedValue(mockIdmAccount);
				idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
				configServiceMock.get.mockReturnValue(true);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.updateLastTriedFailedLogin('id', new Date());
				expect(result).toStrictEqual<Account>(mapper.mapToDo(mockIdmAccount));
			});

			it('should set an user attribute', async () => {
				setup();
				await accountIdmService.updateLastTriedFailedLogin('id', new Date());
				expect(idmServiceMock.setUserAttribute).toHaveBeenCalledTimes(1);
			});
		});

		it('findMany should throw not implemented Exception', async () => {
			await expect(accountIdmService.findMany(0, 0)).rejects.toThrow(NotImplementedException);
		});
	});
});
