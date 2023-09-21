import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId } from '@shared/domain';
import { IdentityManagementService } from '@shared/infra/identity-management/identity-management.service';
import { accountFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountEntityToDtoMapper } from '@src/modules/account/mapper';
import { AccountDto } from '@src/modules/account/services/dto';
import { IServerConfig } from '@src/modules/server';
import bcrypt from 'bcryptjs';
import { LegacyLogger } from '../../../core/logger';
import { AccountRepo } from '../repo/account.repo';
import { AccountServiceDb } from './account-db.service';
import { AccountLookupService } from './account-lookup.service';
import { AbstractAccountService } from './account.service.abstract';

describe('AccountDbService', () => {
	let module: TestingModule;
	let accountService: AbstractAccountService;
	let accountRepo: DeepMocked<AccountRepo>;
	let accountLookupServiceMock: DeepMocked<AccountLookupService>;

	const defaultPassword = 'DummyPasswd!1';

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountServiceDb,
				AccountLookupService,
				{
					provide: AccountRepo,
					useValue: createMock<AccountRepo>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<IServerConfig, true>>(),
				},
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
				{
					provide: AccountLookupService,
					useValue: createMock<AccountLookupService>(),
				},
			],
		}).compile();
		accountRepo = module.get(AccountRepo);
		accountService = module.get(AccountServiceDb);
		accountLookupServiceMock = module.get(AccountLookupService);
		await setupEntities();
	});

	beforeEach(() => {
		jest.resetAllMocks();
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2020, 1, 1));
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe('findById', () => {
		describe('when searching by Id', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);

				mockTeacherAccountDto.username = 'changedUsername@example.org';
				mockTeacherAccountDto.activated = false;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount };
			};
			it(
				'should return accountDto',
				async () => {
					const { mockTeacherAccount } = setup();

					const resultAccount = await accountService.findById(mockTeacherAccount.id);
					expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
				},
				10 * 60 * 1000
			);
		});
	});

	describe('findByUserId', () => {
		describe('when user id exists', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();

				const mockTeacherAccount = accountFactory.buildWithId();

				accountRepo.findByUserId.mockImplementation((userId: EntityId | ObjectId): Promise<Account | null> => {
					if (userId === mockTeacherUser.id) {
						return Promise.resolve(mockTeacherAccount);
					}
					return Promise.resolve(null);
				});

				return { mockTeacherUser, mockTeacherAccount };
			};
			it('should return accountDto', async () => {
				const { mockTeacherUser, mockTeacherAccount } = setup();
				const resultAccount = await accountService.findByUserId(mockTeacherUser.id);
				expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
			});
		});

		describe('when user id not exists', () => {
			it('should return null', async () => {
				const resultAccount = await accountService.findByUserId('nonExistentId');
				expect(resultAccount).toBeNull();
			});
		});
	});

	describe('findByUsernameAndSystemId', () => {
		describe('when user name and system id exists', () => {
			const setup = () => {
				const mockAccountWithSystemId = accountFactory.withSystemId(new ObjectId()).build();
				accountRepo.findByUsernameAndSystemId.mockResolvedValue(mockAccountWithSystemId);
				return { mockAccountWithSystemId };
			};
			it('should return accountDto', async () => {
				const { mockAccountWithSystemId } = setup();
				const resultAccount = await accountService.findByUsernameAndSystemId(
					mockAccountWithSystemId.username,
					mockAccountWithSystemId.systemId ?? ''
				);
				expect(resultAccount).not.toBe(undefined);
			});
		});

		describe('when only system id exists', () => {
			const setup = () => {
				const mockAccountWithSystemId = accountFactory.withSystemId(new ObjectId()).build();
				accountRepo.findByUsernameAndSystemId.mockImplementation(
					(username: string, systemId: EntityId | ObjectId): Promise<Account | null> => {
						if (mockAccountWithSystemId.username === username && mockAccountWithSystemId.systemId === systemId) {
							return Promise.resolve(mockAccountWithSystemId);
						}
						return Promise.resolve(null);
					}
				);
				return { mockAccountWithSystemId };
			};
			it('should return null if username does not exist', async () => {
				const { mockAccountWithSystemId } = setup();
				const resultAccount = await accountService.findByUsernameAndSystemId(
					'nonExistentUsername',
					mockAccountWithSystemId.systemId ?? ''
				);
				expect(resultAccount).toBeNull();
			});
		});

		describe('when only user name exists', () => {
			const setup = () => {
				const mockAccountWithSystemId = accountFactory.withSystemId(new ObjectId()).build();
				accountRepo.findByUsernameAndSystemId.mockImplementation(
					(username: string, systemId: EntityId | ObjectId): Promise<Account | null> => {
						if (mockAccountWithSystemId.username === username && mockAccountWithSystemId.systemId === systemId) {
							return Promise.resolve(mockAccountWithSystemId);
						}
						return Promise.resolve(null);
					}
				);
				return { mockAccountWithSystemId };
			};
			it('should return null if system id does not exist', async () => {
				const { mockAccountWithSystemId } = setup();
				const resultAccount = await accountService.findByUsernameAndSystemId(
					mockAccountWithSystemId.username,
					'nonExistentSystemId' ?? ''
				);
				expect(resultAccount).toBeNull();
			});
		});
	});

	describe('findMultipleByUserId', () => {
		describe('when search existing multiple Ids', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();
				const mockStudentUser = userFactory.buildWithId();

				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPassword,
				});

				accountRepo.findMultipleByUserId.mockImplementation((userIds: (EntityId | ObjectId)[]): Promise<Account[]> => {
					const accounts = [mockStudentAccount, mockTeacherAccount].filter((tempAccount) =>
						userIds.find((userId) => tempAccount.userId?.toString() === userId)
					);
					return Promise.resolve(accounts);
				});
				return { mockStudentUser, mockStudentAccount, mockTeacherUser, mockTeacherAccount };
			};
			it('should return multiple accountDtos', async () => {
				const { mockStudentUser, mockStudentAccount, mockTeacherUser, mockTeacherAccount } = setup();
				const resultAccounts = await accountService.findMultipleByUserId([mockTeacherUser.id, mockStudentUser.id]);
				expect(resultAccounts).toContainEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
				expect(resultAccounts).toContainEqual(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
				expect(resultAccounts).toHaveLength(2);
			});
		});

		describe('when only user name exists', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockStudentAccount = accountFactory.buildWithId();

				accountRepo.findMultipleByUserId.mockImplementation((userIds: (EntityId | ObjectId)[]): Promise<Account[]> => {
					const accounts = [mockStudentAccount, mockTeacherAccount].filter((tempAccount) =>
						userIds.find((userId) => tempAccount.userId?.toString() === userId)
					);
					return Promise.resolve(accounts);
				});
				return {};
			};
			it('should return empty array on mismatch', async () => {
				setup();
				const resultAccount = await accountService.findMultipleByUserId(['nonExistentId1']);
				expect(resultAccount).toHaveLength(0);
			});
		});
	});

	describe('findByUserIdOrFail', () => {
		describe('when user exists', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();
				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});

				accountRepo.findByUserIdOrFail.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherUser, mockTeacherAccount };
			};

			it('should return accountDto', async () => {
				const { mockTeacherUser, mockTeacherAccount } = setup();
				const resultAccount = await accountService.findByUserIdOrFail(mockTeacherUser.id);
				expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
			});
		});

		describe('when user not exists', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();
				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});
				accountRepo.findByUserIdOrFail.mockImplementation((userId: EntityId | ObjectId): Promise<Account> => {
					if (mockTeacherUser.id === userId) {
						return Promise.resolve(mockTeacherAccount);
					}
					throw new EntityNotFoundError(Account.name);
				});
				return {};
			};
			it('should throw EntityNotFoundError', async () => {
				setup();
				await expect(accountService.findByUserIdOrFail('nonExistentId')).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('save', () => {
		describe('when update an existing account', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);

				mockTeacherAccountDto.username = 'changedUsername@example.org';
				mockTeacherAccountDto.activated = false;
				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);
				accountRepo.save.mockResolvedValue();

				return { mockTeacherAccountDto, mockTeacherAccount };
			};

			it('should update', async () => {
				const { mockTeacherAccountDto, mockTeacherAccount } = setup();
				const ret = await accountService.save(mockTeacherAccountDto);

				expect(accountRepo.save).toBeCalledTimes(1);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					id: mockTeacherAccount.id,
					username: mockTeacherAccountDto.username,
					activated: mockTeacherAccountDto.activated,
					systemId: mockTeacherAccount.systemId,
					userId: mockTeacherAccount.userId,
				});
			});
		});

		describe("when update an existing account's system", () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);

				mockTeacherAccountDto.username = 'changedUsername@example.org';
				mockTeacherAccountDto.systemId = '123456789012';
				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);
				accountRepo.save.mockResolvedValue();

				return { mockTeacherAccountDto, mockTeacherAccount };
			};
			it("should update an existing account's system", async () => {
				const { mockTeacherAccountDto, mockTeacherAccount } = setup();

				const ret = await accountService.save(mockTeacherAccountDto);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					id: mockTeacherAccount.id,
					username: mockTeacherAccountDto.username,
					activated: mockTeacherAccount.activated,
					systemId: new ObjectId(mockTeacherAccountDto.systemId),
					userId: mockTeacherAccount.userId,
				});
			});
		});

		describe("when update an existing account's user", () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockStudentUser = accountFactory.buildWithId();
				const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);

				mockTeacherAccountDto.username = 'changedUsername@example.org';
				mockTeacherAccountDto.userId = mockStudentUser.id;
				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);
				accountRepo.save.mockResolvedValue();

				return { mockStudentUser, mockTeacherAccountDto, mockTeacherAccount };
			};
			it('should update', async () => {
				const { mockStudentUser, mockTeacherAccountDto, mockTeacherAccount } = setup();

				const ret = await accountService.save(mockTeacherAccountDto);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					id: mockTeacherAccount.id,
					username: mockTeacherAccountDto.username,
					activated: mockTeacherAccount.activated,
					systemId: mockTeacherAccount.systemId,
					userId: new ObjectId(mockStudentUser.id),
				});
			});
		});

		describe("when existing account's system is undefined", () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);

				mockTeacherAccountDto.username = 'changedUsername@example.org';
				mockTeacherAccountDto.systemId = undefined;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);
				accountRepo.save.mockResolvedValue();

				return { mockTeacherAccountDto, mockTeacherAccount };
			};
			it('should keep undefined on update', async () => {
				const { mockTeacherAccountDto, mockTeacherAccount } = setup();

				const ret = await accountService.save(mockTeacherAccountDto);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					id: mockTeacherAccount.id,
					username: mockTeacherAccountDto.username,
					activated: mockTeacherAccount.activated,
					systemId: mockTeacherAccountDto.systemId,
					userId: mockTeacherAccount.userId,
				});
			});
		});

		describe('when account not exists', () => {
			const setup = () => {
				const mockUserWithoutAccount = userFactory.buildWithId();

				const accountToSave: AccountDto = {
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'asdf@asdf.de',
					userId: mockUserWithoutAccount.id,
					systemId: '012345678912',
					password: defaultPassword,
				} as AccountDto;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				return { accountToSave };
			};
			it('should save a new account', async () => {
				const { accountToSave } = setup();

				const ret = await accountService.save(accountToSave);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					username: accountToSave.username,
					userId: new ObjectId(accountToSave.userId),
					systemId: new ObjectId(accountToSave.systemId),
					createdAt: accountToSave.createdAt,
					updatedAt: accountToSave.updatedAt,
				});
			});
		});

		describe("when account's system undefined", () => {
			const setup = () => {
				const mockUserWithoutAccount = userFactory.buildWithId();

				const accountToSave: AccountDto = {
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'asdf@asdf.de',
					userId: mockUserWithoutAccount.id,
					password: defaultPassword,
				} as AccountDto;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				return { accountToSave };
			};
			it('should keep undefined on save', async () => {
				const { accountToSave } = setup();

				const ret = await accountService.save(accountToSave);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					systemId: undefined,
				});
			});
		});

		describe('when save account', () => {
			const setup = () => {
				const mockUserWithoutAccount = userFactory.buildWithId();

				const accountToSave = {
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'asdf@asdf.de',
					userId: mockUserWithoutAccount.id,
					systemId: '012345678912',
					password: defaultPassword,
				} as AccountDto;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				return { accountToSave };
			};
			it('should encrypt password', async () => {
				const { accountToSave } = setup();

				await accountService.save(accountToSave);
				const ret = await accountService.save(accountToSave);
				expect(ret).toBeDefined();
				expect(ret).not.toMatchObject({
					password: defaultPassword,
				});
			});
		});

		describe('when creating a new account', () => {
			const setup = () => {
				const spy = jest.spyOn(accountRepo, 'save');
				const dto = {
					username: 'john.doe@domain.tld',
					password: '',
				} as AccountDto;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				return { spy, dto };
			};
			it('should set password to undefined if password is empty', async () => {
				const { spy, dto } = setup();

				await expect(accountService.save(dto)).resolves.not.toThrow();
				expect(accountRepo.findById).not.toHaveBeenCalled();
				expect(spy).toHaveBeenCalledWith(
					expect.objectContaining({
						password: undefined,
					})
				);
			});
		});

		describe('when password is empty while editing an existing account', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();

				const spy = jest.spyOn(accountRepo, 'save');
				const dto = {
					id: mockTeacherAccount.id,
					password: undefined,
				} as AccountDto;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);
				accountRepo.save.mockResolvedValue();

				return { mockTeacherAccount, spy, dto };
			};
			it('should not change password', async () => {
				const { mockTeacherAccount, spy, dto } = setup();
				await expect(accountService.save(dto)).resolves.not.toThrow();
				expect(accountRepo.findById).toHaveBeenCalled();
				expect(spy).toHaveBeenCalledWith(
					expect.objectContaining({
						password: mockTeacherAccount.password,
					})
				);
			});
		});
	});

	describe('updateUsername', () => {
		describe('when updating username', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
				const newUsername = 'newUsername';

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);

				return { mockTeacherAccount, mockTeacherAccountDto, newUsername };
			};
			it('should update only user name', async () => {
				const { mockTeacherAccount, mockTeacherAccountDto, newUsername } = setup();
				const ret = await accountService.updateUsername(mockTeacherAccount.id, newUsername);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					...mockTeacherAccountDto,
					username: newUsername,
				});
			});
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		describe('when update last failed Login', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
				const theNewDate = new Date();

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);

				return { mockTeacherAccount, mockTeacherAccountDto, theNewDate };
			};
			it('should update last tried failed login', async () => {
				const { mockTeacherAccount, mockTeacherAccountDto, theNewDate } = setup();
				const ret = await accountService.updateLastTriedFailedLogin(mockTeacherAccount.id, theNewDate);

				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					...mockTeacherAccountDto,
					lasttriedFailedLogin: theNewDate,
				});
			});
		});
	});

	describe('validatePassword', () => {
		describe('when accepted Password', () => {
			const setup = async () => {
				const ret = await accountService.validatePassword(
					{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as AccountDto,
					defaultPassword
				);

				return { ret };
			};
			it('should validate password', async () => {
				const { ret } = await setup();

				expect(ret).toBe(true);
			});
		});

		describe('when wrong Password', () => {
			const setup = async () => {
				const ret = await accountService.validatePassword(
					{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as AccountDto,
					'incorrectPwd'
				);

				return { ret };
			};
			it('should report', async () => {
				const { ret } = await setup();

				expect(ret).toBe(false);
			});
		});

		describe('when missing account password', () => {
			const setup = async () => {
				const ret = await accountService.validatePassword({ password: undefined } as AccountDto, 'incorrectPwd');

				return { ret };
			};
			it('should report', async () => {
				const { ret } = await setup();

				expect(ret).toBe(false);
			});
		});
	});

	describe('updatePassword', () => {
		describe('when update Password', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();
				const newPassword = 'newPassword';

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);

				return { mockTeacherAccount, newPassword };
			};
			it('should update password', async () => {
				const { mockTeacherAccount, newPassword } = setup();

				const ret = await accountService.updatePassword(mockTeacherAccount.id, newPassword);

				expect(ret).toBeDefined();
				if (ret.password) {
					await expect(bcrypt.compare(newPassword, ret.password)).resolves.toBe(true);
				} else {
					fail('return password is undefined');
				}
			});
		});
	});

	describe('delete', () => {
		describe('when deleting existing account', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);

				return { mockTeacherAccount };
			};
			it('should delete account via repo', async () => {
				const { mockTeacherAccount } = setup();
				await accountService.delete(mockTeacherAccount.id);
				expect(accountRepo.deleteById).toHaveBeenCalledWith(new ObjectId(mockTeacherAccount.id));
			});
		});

		describe('when deleting non existing account', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValueOnce(null);

				return { mockTeacherAccount };
			};

			it('should throw', async () => {
				const { mockTeacherAccount } = setup();
				await expect(accountService.delete(mockTeacherAccount.id)).rejects.toThrow();
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('when delete account with given user id', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();

				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);

				return { mockTeacherUser, mockTeacherAccount };
			};
			it('should delete via repo', async () => {
				const { mockTeacherUser, mockTeacherAccount } = setup();

				await accountService.deleteByUserId(mockTeacherAccount.userId?.toString() ?? '');
				expect(accountRepo.deleteByUserId).toHaveBeenCalledWith(mockTeacherUser.id);
			});
		});
	});

	describe('searchByUsernamePartialMatch', () => {
		describe('when searching by part of username', () => {
			const setup = () => {
				const partialUserName = 'admin';
				const skip = 2;
				const limit = 10;
				const mockTeacherAccount = accountFactory.buildWithId();
				const mockStudentAccount = accountFactory.buildWithId();
				const mockAccountWithSystemId = accountFactory.withSystemId(new ObjectId()).build();
				const mockAccounts = [mockTeacherAccount, mockStudentAccount, mockAccountWithSystemId];

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.searchByUsernamePartialMatch.mockResolvedValue([
					[mockTeacherAccount, mockStudentAccount, mockAccountWithSystemId],
					3,
				]);
				accountLookupServiceMock.getInternalId.mockResolvedValue(mockTeacherAccount._id);

				return { partialUserName, skip, limit, mockTeacherAccount, mockAccounts };
			};
			it('should call repo', async () => {
				const { partialUserName, skip, limit, mockTeacherAccount, mockAccounts } = setup();
				const [accounts, total] = await accountService.searchByUsernamePartialMatch(partialUserName, skip, limit);
				expect(accountRepo.searchByUsernamePartialMatch).toHaveBeenCalledWith(partialUserName, skip, limit);
				expect(total).toBe(mockAccounts.length);

				expect(accounts[0]).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
			});
		});
	});

	describe('searchByUsernameExactMatch', () => {
		describe('when searching by username', () => {
			const setup = () => {
				const partialUserName = 'admin';
				const mockTeacherAccount = accountFactory.buildWithId();

				accountRepo.searchByUsernameExactMatch.mockResolvedValue([[mockTeacherAccount], 1]);

				return { partialUserName, mockTeacherAccount };
			};
			it('should call repo', async () => {
				const { partialUserName, mockTeacherAccount } = setup();
				const [accounts, total] = await accountService.searchByUsernameExactMatch(partialUserName);
				expect(accountRepo.searchByUsernameExactMatch).toHaveBeenCalledWith(partialUserName);
				expect(total).toBe(1);
				expect(accounts[0]).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
			});
		});
	});
	describe('findMany', () => {
		describe('when find many one time', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();

				accountRepo.findMany.mockResolvedValue([mockTeacherAccount]);

				return {};
			};
			it('should call repo', async () => {
				setup();
				const foundAccounts = await accountService.findMany(1, 1);
				expect(accountRepo.findMany).toHaveBeenCalledWith(1, 1);
				expect(foundAccounts).toBeDefined();
			});
		});
		describe('when call find many more than one time', () => {
			const setup = () => {
				const mockTeacherAccount = accountFactory.buildWithId();

				accountRepo.findMany.mockResolvedValue([mockTeacherAccount]);

				return {};
			};
			it('should call repo', async () => {
				setup();
				const foundAccounts = await accountService.findMany();
				expect(accountRepo.findMany).toHaveBeenCalledWith(0, 100);
				expect(foundAccounts).toBeDefined();
			});
		});
	});
});
