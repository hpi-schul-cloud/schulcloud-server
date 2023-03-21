import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IAccount } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { IdentityManagementService } from '@shared/infra/identity-management';
import { AccountIdmToDtoMapper } from '../mapper/account-idm-to-dto.mapper';
import { AccountServiceIdm } from './account-idm.service';
import { AccountDto, AccountSaveDto } from './dto';

describe('AccountIdmService', () => {
	let module: TestingModule;
	let accountIdmService: AccountServiceIdm;
	let idmServiceMock: DeepMocked<IdentityManagementService>;

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
								FEATURE_IDENTITY_MANAGEMENT_IS_PRIMARY: true,
							};
						},
					],
				}),
			],
			providers: [
				AccountServiceIdm,
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
			],
		}).compile();
		accountIdmService = module.get(AccountServiceIdm);
		idmServiceMock = module.get(IdentityManagementService);
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
		const setup = () => {
			idmServiceMock.findAccountByFctIntId.mockResolvedValue(mockIdmAccount);
		};

		it('should delete account via repo', async () => {
			setup();
			const deleteSpy = jest.spyOn(idmServiceMock, 'deleteAccountById');

			await expect(accountIdmService.delete(mockIdmAccountRefId)).resolves.not.toThrow();
			expect(deleteSpy).toHaveBeenCalledWith(mockIdmAccount.attRefTechnicalId);
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
				expect(result).toStrictEqual<AccountDto>(AccountIdmToDtoMapper.mapToDto(mockIdmAccount));
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
				idmServiceMock.getAllAccounts.mockResolvedValue([mockIdmAccount]);
			};

			it('should return the accounts', async () => {
				setup();
				const result = await accountIdmService.findMultipleByUserId(['id', 'id1', 'id2']);
				expect(result).toStrictEqual<AccountDto[]>([AccountIdmToDtoMapper.mapToDto(mockIdmAccount)]);
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
				expect(result).toStrictEqual<AccountDto>(AccountIdmToDtoMapper.mapToDto(mockIdmAccount));
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
				expect(result).toStrictEqual<AccountDto>(AccountIdmToDtoMapper.mapToDto(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountByFctIntId.mockRejectedValue(new Error());
			};

			it('should throw', async () => {
				setup();
				await expect(accountIdmService.findByUserIdOrFail('notExistingId')).rejects.toThrow();
			});
		});
	});

	describe('findByUsernameAndSystemId', () => {
		describe('when finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([mockIdmAccount]);
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.findByUsernameAndSystemId('username', 'fctExtId');
				expect(result).toStrictEqual<AccountDto>(AccountIdmToDtoMapper.mapToDto(mockIdmAccount));
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([]);
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
				idmServiceMock.findAccountsByUsername.mockResolvedValue([mockIdmAccount]);
			};

			it('should return the account', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernamePartialMatch('username', 0, 10);
				expect(result).toStrictEqual<AccountDto[]>([AccountIdmToDtoMapper.mapToDto(mockIdmAccount)]);
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([]);
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
				idmServiceMock.findAccountsByUsername.mockResolvedValue([mockIdmAccount]);
			};

			it('should return the account', async () => {
				setup();
				const [result] = await accountIdmService.searchByUsernameExactMatch('username');
				expect(result).toStrictEqual<AccountDto[]>([AccountIdmToDtoMapper.mapToDto(mockIdmAccount)]);
			});
		});

		describe('when not finding an account', () => {
			const setup = () => {
				idmServiceMock.findAccountsByUsername.mockResolvedValue([]);
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
			};

			it('should return the account', async () => {
				setup();
				const result = await accountIdmService.updateLastTriedFailedLogin('id', new Date());
				expect(result).toStrictEqual<AccountDto>(AccountIdmToDtoMapper.mapToDto(mockIdmAccount));
			});

			it('should set an user attribute', async () => {
				setup();
				await accountIdmService.updateLastTriedFailedLogin('id', new Date());
				expect(idmServiceMock.setUserAttribute).toHaveBeenCalledTimes(1);
			});
		});
	});
});
