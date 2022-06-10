import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, Role, School, User, RoleName, Permission } from '@shared/domain';
import { AccountRepo } from '@shared/repo';
import { accountFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountDto } from '@src/modules/account/services/dto';
import { AccountEntityToDtoMapper } from '@src/modules/account/mapper';
import { AccountService } from './account.service';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let orm: MikroORM;
	let mockAccounts: Account[];
	let accountRepo: AccountRepo;

	const defaultPassword = 'Schucloud1!';

	let mockSchool: School;

	let mockTeacherUser: User;
	let mockStudentUser: User;
	let mockUserWithoutAccount: User;

	let mockTeacherAccount: Account;
	let mockStudentAccount: Account;

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountService,
				{
					provide: AccountRepo,
					useValue: {
						save: jest.fn().mockImplementation((account: Account): Promise<void> => {
							if (account.username === 'fail@to.update') {
								return Promise.reject();
							}
							const accountEntity = mockAccounts.find((tempAccount) => tempAccount.userId === account.userId);
							if (accountEntity) {
								Object.assign(accountEntity, account);
							}

							return Promise.resolve();
						}),
						deleteById: jest.fn().mockImplementation((): Promise<void> => {
							return Promise.resolve();
						}),
						findMultipleByUserId: (userIds: EntityId[]): Promise<Account[]> => {
							const accounts = mockAccounts.filter((tempAccount) =>
								userIds.find((userId) => tempAccount.userId?.toString() === userId)
							);
							return Promise.resolve(accounts);
						},
						findByUserId: (userId: EntityId): Promise<Account | null> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId?.toString() === userId);
							if (account) {
								return Promise.resolve(account);
							}
							return Promise.resolve(null);
						},
						findByUserIdOrFail: (userId: EntityId): Promise<Account> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId?.toString() === userId);

							if (account) {
								return Promise.resolve(account);
							}
							throw new EntityNotFoundError(Account.name);
						},
						findById: jest.fn().mockImplementation((accountId: EntityId): Promise<Account> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.id === accountId);

							if (account) {
								return Promise.resolve(account);
							}
							throw new EntityNotFoundError(Account.name);
						}),
						searchByUsernameExactMatch: jest.fn().mockImplementation((): Promise<[Account[], number]> => {
							return Promise.resolve([[mockTeacherAccount], 1]);
						}),
						searchByUsernamePartialMatch: jest.fn().mockImplementation((): Promise<[Account[], number]> => {
							return Promise.resolve([mockAccounts, mockAccounts.length]);
						}),
					},
				},
			],
		}).compile();
		accountRepo = module.get(AccountRepo);
		accountService = module.get(AccountService);
		orm = await setupEntities();
	});

	beforeEach(() => {
		mockSchool = schoolFactory.buildWithId();

		mockTeacherUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
		});
		mockStudentUser = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.STUDENT, permissions: [] })],
		});
		mockUserWithoutAccount = userFactory.buildWithId({
			school: mockSchool,
			roles: [new Role({ name: RoleName.TEACHER, permissions: [Permission.STUDENT_EDIT] })],
		});
		mockTeacherAccount = accountFactory.buildWithId({ userId: mockTeacherUser.id, password: defaultPassword });
		mockStudentAccount = accountFactory.buildWithId({ userId: mockStudentUser.id, password: defaultPassword });

		mockAccounts = [mockTeacherAccount, mockStudentAccount];
	});

	describe('findById', () => {
		it('should return accountDto', async () => {
			const resultAccount = await accountService.findById(mockTeacherAccount.id);
			expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
		});
	});

	describe('findByUserId', () => {
		it('should return accountDto', async () => {
			const resultAccount = await accountService.findByUserId(mockTeacherUser.id);
			expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
		});
		it('should return null', async () => {
			const resultAccount = await accountService.findByUserId('nonExistentId');
			expect(resultAccount).toBeNull();
		});
	});

	describe('findMultipleByUserId', () => {
		it('should return multiple accountDtos', async () => {
			const resultAccounts = await accountService.findMultipleByUserId([mockTeacherUser.id, mockStudentUser.id]);
			expect(resultAccounts).toContainEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
			expect(resultAccounts).toContainEqual(AccountEntityToDtoMapper.mapToDto(mockStudentAccount));
			expect(resultAccounts).toHaveLength(2);
		});
		it('should return empty array on mismatch', async () => {
			const resultAccount = await accountService.findMultipleByUserId(['nonExistentId1']);
			expect(resultAccount).toHaveLength(0);
		});
	});

	describe('findByUserIdOrFail', () => {
		it('should return accountDto', async () => {
			const resultAccount = await accountService.findByUserIdOrFail(mockTeacherUser.id);
			expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
		});
		it('should throw EntityNotFoundError', async () => {
			await expect(accountService.findByUserIdOrFail('nonExistentId')).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('save', () => {
		beforeEach(() => {
			jest.useFakeTimers('modern');
			jest.setSystemTime(new Date(2020, 1, 1));
		});

		afterEach(() => {
			jest.runOnlyPendingTimers();
			jest.useRealTimers();
		});

		it('should update an existing account', async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.activated = false;
			await accountService.save(mockTeacherAccountDto);
			expect(accountRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					...mockTeacherAccount,
					username: mockTeacherAccountDto.username,
					activated: mockTeacherAccountDto.activated,
				})
			);
		});

		it("should update an existing account's system", async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.systemId = '123456789012';
			await accountService.save(mockTeacherAccountDto);
			expect(accountRepo.save).toHaveBeenCalledWith({
				...mockTeacherAccount,
				username: mockTeacherAccountDto.username,
				systemId: new ObjectId(mockTeacherAccountDto.systemId),
			});
		});
		it("should update an existing account's user", async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.userId = mockStudentUser.id;
			await accountService.save(mockTeacherAccountDto);
			expect(accountRepo.save).toHaveBeenCalledWith({
				...mockTeacherAccount,
				username: mockTeacherAccountDto.username,
				activated: mockTeacherAccountDto.activated,
				userId: new ObjectId(mockStudentUser.id),
			});
		});
		it("should keep existing account's system undefined on update", async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.systemId = undefined;
			await accountService.save(mockTeacherAccountDto);
			expect(accountRepo.save).toHaveBeenCalledWith({
				...mockTeacherAccount,
				username: mockTeacherAccountDto.username,
				systemId: mockTeacherAccountDto.systemId,
			});
		});
		it('should save a new account', async () => {
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
			await accountService.save(accountToSave);
			expect(accountRepo.findById).not.toHaveBeenCalled();
			expect(accountRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: null,
					username: accountToSave.username,
					userId: new ObjectId(accountToSave.userId),
					systemId: new ObjectId(accountToSave.systemId),
					createdAt: accountToSave.createdAt,
					updatedAt: accountToSave.updatedAt,
				})
			);
		});

		it("should keep account's system undefined on save", async () => {
			const accountToSave: AccountDto = {
				createdAt: new Date(),
				updatedAt: new Date(),
				username: 'asdf@asdf.de',
				userId: mockUserWithoutAccount.id,
				password: defaultPassword,
			} as AccountDto;
			(accountRepo.findById as jest.Mock).mockClear();
			(accountRepo.save as jest.Mock).mockClear();
			await accountService.save(accountToSave);
			expect(accountRepo.findById).not.toHaveBeenCalled();
			expect(accountRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: null,
					createdAt: accountToSave.createdAt,
					updatedAt: accountToSave.updatedAt,
					username: accountToSave.username,
					userId: new ObjectId(accountToSave.userId),
				})
			);
		});

		it('should encrypt password', async () => {
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
			await accountService.save(accountToSave);
			expect(accountRepo.findById).not.toHaveBeenCalled();
			expect(accountRepo.save).not.toHaveBeenCalledWith(
				expect.objectContaining({
					password: defaultPassword,
				})
			);
		});
	});

	describe('delete', () => {
		it('should delete account via repo', async () => {
			await accountService.delete(mockTeacherAccount.id);
			expect(accountRepo.deleteById).toHaveBeenCalledWith(mockTeacherAccount.id);
		});
	});

	describe('searchByUsernamePartialMatch', () => {
		it('should call repo', async () => {
			const partialUserName = 'admin';
			const skip = 2;
			const limit = 10;
			const foundAccounts = await accountService.searchByUsernamePartialMatch(partialUserName, skip, limit);
			expect(accountRepo.searchByUsernamePartialMatch).toHaveBeenCalledWith(partialUserName, skip, limit);
			expect(foundAccounts.total).toBe(mockAccounts.length);

			expect(foundAccounts.accounts[0]).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
		});
	});
	describe('searchByUsernameExactMatch', () => {
		it('should call repo', async () => {
			const partialUserName = 'admin';
			const foundAccounts = await accountService.searchByUsernameExactMatch(partialUserName);
			expect(accountRepo.searchByUsernameExactMatch).toHaveBeenCalledWith(partialUserName);
			expect(foundAccounts.total).toBe(1);
			expect(foundAccounts.accounts[0]).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
		});
	});
});
