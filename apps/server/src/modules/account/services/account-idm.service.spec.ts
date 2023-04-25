import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { IAccount } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { IdentityManagementOauthService, IdentityManagementService } from '@shared/infra/identity-management';
import { NotImplementedException } from '@nestjs/common';
import { AccountIdmToDtoMapper, AccountIdmToDtoMapperDb } from '../mapper';
import { AccountServiceIdm } from './account-idm.service';
import { AccountLookupService } from './account-lookup.service';
import { AccountDto, AccountSaveDto } from './dto';

describe('AccountIdmService', () => {
	let module: TestingModule;
	let accountIdmService: AccountServiceIdm;
	let mapper: AccountIdmToDtoMapper;
	let idmServiceMock: DeepMocked<IdentityManagementService>;
	let accountLookupServiceMock: DeepMocked<AccountLookupService>;
	let idmOauthServiceMock: DeepMocked<IdentityManagementOauthService>;

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
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				AccountServiceIdm,
				{
					provide: AccountIdmToDtoMapper,
					useValue: new AccountIdmToDtoMapperDb(),
				},
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
				{
					provide: AccountLookupService,
					useValue: createMock<AccountLookupService>(),
				},
				{
					provide: IdentityManagementOauthService,
					useValue: createMock<IdentityManagementOauthService>(),
				},
			],
		}).compile();
		accountIdmService = module.get(AccountServiceIdm);
		mapper = module.get(AccountIdmToDtoMapper);
		idmServiceMock = module.get(IdentityManagementService);
		accountLookupServiceMock = module.get(AccountLookupService);
		idmOauthServiceMock = module.get(IdentityManagementOauthService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('save', () => {
		const setup = () => {
			idmServiceMock.createAccount.mockResolvedValue(mockIdmAccount.id);
			idmServiceMock.updateAccount.mockResolvedValue(mockIdmAccount.id);
			idmServiceMock.updateAccountPassword.mockResolvedValue(mockIdmAccount.id);
			idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
		};

		it('should update an existing account', async () => {
			setup();
			const updateSpy = jest.spyOn(idmServiceMock, 'updateAccount');
			const createSpy = jest.spyOn(idmServiceMock, 'createAccount');

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
			setup();
			const updateSpy = jest.spyOn(idmServiceMock, 'updateAccount');
			const updatePasswordSpy = jest.spyOn(idmServiceMock, 'updateAccountPassword');

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
			setup();
			const updateSpy = jest.spyOn(idmServiceMock, 'updateAccount');
			const createSpy = jest.spyOn(idmServiceMock, 'createAccount');

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
			setup();
			accountLookupServiceMock.getExternalId.mockResolvedValue(null);
			const mockAccountDto = {
				id: mockIdmAccountRefId,
				username: 'testUserName',
				userId: 'userId',
				systemId: 'systemId',
			};

			const ret = await accountIdmService.save(mockAccountDto);

			expect(idmServiceMock.createAccount).toHaveBeenCalled();
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
			accountLookupServiceMock.getExternalId.mockResolvedValue(mockIdmAccount.id);
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
			accountLookupServiceMock.getExternalId.mockResolvedValue(mockIdmAccount.id);
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

	describe('validatePassword', () => {
		const setup = (acceptPassword: boolean) => {
			idmOauthServiceMock.resourceOwnerPasswordGrant.mockResolvedValue(
				acceptPassword ? '{ "alg": "HS256", "typ": "JWT" }' : undefined
			);
		};
		it('should validate password by checking JWT', async () => {
			setup(true);
			const ret = await accountIdmService.validatePassword(
				{ username: 'username' } as unknown as AccountDto,
				'password'
			);
			expect(ret).toBe(true);
		});
		it('should report wrong password, i. e. non successful JWT creation', async () => {
			setup(false);
			const ret = await accountIdmService.validatePassword(
				{ username: 'username' } as unknown as AccountDto,
				'password'
			);
			expect(ret).toBe(false);
		});
	});

	describe('delete', () => {
		describe('when deleting existing account', () => {
			const setup = () => {
				idmServiceMock.deleteAccountById.mockResolvedValue(mockIdmAccount.id);
				accountLookupServiceMock.getExternalId.mockResolvedValue(mockIdmAccount.id);
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
				accountLookupServiceMock.getExternalId.mockResolvedValue(null);
			};

			it('should throw error', async () => {
				setup();
				await expect(accountIdmService.delete(mockIdmAccountRefId)).rejects.toThrow();
			});
		});
	});

	describe('deleteByUserId', () => {
		const setup = () => {
			idmServiceMock.findAccountByFctIntId.mockResolvedValue(mockIdmAccount);
		};

		it('should delete the account with given user id via repo', async () => {
			setup();
			const deleteSpy = jest.spyOn(idmServiceMock, 'deleteAccountById');

			await accountIdmService.deleteByUserId(mockIdmAccount.attRefFunctionalIntId ?? '');
			expect(deleteSpy).toHaveBeenCalledWith(mockIdmAccount.id);
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
				expect(result).toStrictEqual<AccountDto>(mapper.mapToDto(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountById.mockRejectedValue(new Error());
			};

			it('should throw', async () => {
				setup();
				await expect(accountIdmService.findById('notExistingId')).rejects.toThrow();
			});
		});
	});

	describe('findMultipleByUserId', () => {
		describe('when finding accounts', () => {
			const setup = () => {
				const accounts = [mockIdmAccount];
				idmServiceMock.findAccountByFctIntId.mockImplementation(() => {
					const element = accounts.pop() as IAccount;
					if (element) {
						return Promise.resolve(element);
					}
					throw new Error();
				});
			};

			it('should return the accounts', async () => {
				setup();
				const result = await accountIdmService.findMultipleByUserId(['id', 'id1', 'id2']);
				expect(result).toStrictEqual<AccountDto[]>([mapper.mapToDto(mockIdmAccount)]);
			});
		});
	});

	describe('findByUserId', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByFctIntId.mockResolvedValue(mockIdmAccount);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.findByUserId(mockIdmAccount.attRefFunctionalIntId ?? '');
				expect(result).toStrictEqual<AccountDto>(mapper.mapToDto(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByFctIntId.mockResolvedValue(undefined as unknown as IAccount);
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
				idmServiceMock.findAccountByFctIntId.mockResolvedValue(mockIdmAccount);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.findByUserIdOrFail(mockIdmAccountRefId);
				expect(result).toStrictEqual<AccountDto>(mapper.mapToDto(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByFctIntId.mockResolvedValue(undefined as unknown as IAccount);
			};

			it('should throw', async () => {
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
				const result = await accountIdmService.findByUsernameAndSystemId('username', 'fctExtId');
				expect(result).toStrictEqual<AccountDto>(mapper.mapToDto(mockIdmAccount));
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
				expect(result).toStrictEqual<AccountDto[]>([mapper.mapToDto(mockIdmAccount)]);
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[], 0]);
			};

			it('should return an empty list', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernamePartialMatch('username', 0, 10);
				expect(result).toStrictEqual<AccountDto[]>([]);
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
				expect(result).toStrictEqual<AccountDto[]>([mapper.mapToDto(mockIdmAccount)]);
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([[], 0]);
			};

			it('should return an empty list', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernameExactMatch('username');
				expect(result).toStrictEqual<AccountDto[]>([]);
			});
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		describe('when updating the last tried failed login', () => {
			const setup = () => {
				idmServiceMock.findAccountByTecRefId.mockResolvedValue(mockIdmAccount);
				idmServiceMock.findAccountById.mockResolvedValue(mockIdmAccount);
				accountLookupServiceMock.getExternalId.mockResolvedValue(mockIdmAccount.id);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.updateLastTriedFailedLogin('id', new Date());
				expect(result).toStrictEqual<AccountDto>(mapper.mapToDto(mockIdmAccount));
			});

			it('should set an user attribute', async () => {
				setup();
				await accountIdmService.updateLastTriedFailedLogin('id', new Date());
				expect(idmServiceMock.setUserAttribute).toHaveBeenCalledTimes(1);
			});
		});

		it('findMany should throw', async () => {
			await expect(accountIdmService.findMany(0, 0)).rejects.toThrow(NotImplementedException);
		});
	});
});
