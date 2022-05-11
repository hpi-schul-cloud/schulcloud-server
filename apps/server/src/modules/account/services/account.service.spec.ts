import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, Role, School, User, RoleName, Permission } from '@shared/domain';
import { AccountRepo } from '@shared/repo';
import { accountFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountEntityToDtoMapper } from '../mapper/account-entity-to-dto.mapper';
import { AccountService } from './account.service';
import { AccountDto } from './dto/account.dto';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let orm: MikroORM;
	let mockAccounts: Account[];
	let mockUsers: User[];
	let accountRepo: AccountRepo;

	const defaultPasswordHash = '$2a$10$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

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
						findByUserId: (userId: EntityId): Promise<Account | null> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId === userId);

							if (account) {
								return Promise.resolve(account);
							}
							return Promise.resolve(null);
						},
						findByUserIdOrFail: (userId: EntityId): Promise<Account> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId === userId);

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
						searchByUsernameExactMatch: jest
							.fn()
							.mockImplementation((username: string): Promise<[Account[], number]> => {
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
		mockTeacherAccount = accountFactory.buildWithId({
			userId: mockTeacherUser.id,
			password: defaultPasswordHash,
		});
		mockStudentAccount = accountFactory.buildWithId({
			userId: mockStudentUser.id,
			password: defaultPasswordHash,
		});

		mockAccounts = [mockTeacherAccount, mockStudentAccount];
		mockUsers = [mockTeacherUser, mockStudentUser, mockUserWithoutAccount];
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

	describe('findByUserIdOrFail', () => {
		it('should return accountDto', async () => {
			const resultAccount = await accountService.findByUserIdOrFail(mockTeacherUser.id);
			expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
		});
		it('should return null', async () => {
			await expect(accountService.findByUserIdOrFail('nonExistentId')).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('save', () => {
		it('should update an existing account', async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.activated = false;
			await accountService.save(mockTeacherAccountDto);
			expect(accountRepo.save).toHaveBeenCalledWith({
				...mockTeacherAccount,
				username: mockTeacherAccountDto.username,
				activated: mockTeacherAccountDto.activated,
			});
		});

		it("should update an existing account's system", async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.systemId = 'dummySystemId';
			await accountService.save(mockTeacherAccountDto);
			expect(accountRepo.save).toHaveBeenCalledWith({
				...mockTeacherAccount,
				username: mockTeacherAccountDto.username,
				systemId: mockTeacherAccountDto.systemId,
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
				userId: mockStudentUser.id,
			});
		});
		it('should save a new account', async () => {
			const accountToSave: AccountDto = {
				createdAt: new Date(),
				updatedAt: new Date(),
				username: 'asdf@asdf.de',
				userId: mockUserWithoutAccount.id,
				password: defaultPasswordHash,
			} as AccountDto;
			(accountRepo.findById as jest.Mock).mockClear();
			(accountRepo.save as jest.Mock).mockClear();
			await accountService.save(accountToSave);
			expect(accountRepo.findById).not.toHaveBeenCalled();
			// eslint-disable-next-line jest/unbound-method
			const accountSave = accountRepo.save as jest.Mock;
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			expect(accountSave.mock.calls[0][0]).toMatchObject({
				username: 'asdf@asdf.de',
				password: defaultPasswordHash,
			});
		});
	});
	describe('delete', () => {
		it('should delete account via repo', async () => {
			await accountService.delete(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
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
