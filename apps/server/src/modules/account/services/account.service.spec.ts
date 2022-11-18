import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, EntityId, Permission, Role, RoleName, School, User } from '@shared/domain';
import { AccountRepo } from '@shared/repo';
import { accountFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { AccountEntityToDtoMapper } from '@src/modules/account/mapper';
import { AccountDto } from '@src/modules/account/services/dto';
import bcrypt from 'bcryptjs';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdentityManagementService } from '@shared/infra/identity-management/identity-management.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../../../core/logger';
import { AccountService } from './account.service';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let orm: MikroORM;
	let loggerMock: DeepMocked<Logger>;
	let configServiceMock: DeepMocked<ConfigService>;
	let idmServiceMock: DeepMocked<IdentityManagementService>;
	let mockAccounts: Account[];
	let accountRepo: AccountRepo;

	const defaultPassword = 'DummyPasswd!1';

	let mockSchool: School;

	let mockTeacherUser: User;
	let mockStudentUser: User;
	let mockUserWithoutAccount: User;

	let mockTeacherAccount: Account;
	let mockStudentAccount: Account;

	let mockAccountWithSystemId: Account;

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
						findByUsernameAndSystemId: (username: string, systemId: EntityId | ObjectId): Promise<Account | null> => {
							const account = mockAccounts.find(
								(tempAccount) => tempAccount.username === username && tempAccount.systemId === systemId
							);
							if (account) {
								return Promise.resolve(account);
							}
							return Promise.resolve(null);
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
						deleteByUserId: jest.fn().mockImplementation((): Promise<void> => {
							return Promise.resolve();
						}),
					},
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
			],
		}).compile();
		accountRepo = module.get(AccountRepo);
		accountService = module.get(AccountService);
		loggerMock = module.get(Logger);
		configServiceMock = module.get(ConfigService);
		idmServiceMock = module.get(IdentityManagementService);
		orm = await setupEntities();
	});

	beforeEach(() => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date(2020, 1, 1));

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

		mockAccountWithSystemId = accountFactory.withSystemId(new ObjectId()).build();
		mockAccounts = [mockTeacherAccount, mockStudentAccount, mockAccountWithSystemId];
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
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

	describe('findByUsernameAndSystemId', () => {
		it('should return accountDto', async () => {
			const resultAccount = await accountService.findByUsernameAndSystemId(
				mockAccountWithSystemId.username,
				mockAccountWithSystemId.systemId ?? ''
			);
			expect(resultAccount).not.toBe(undefined);
		});
		it('should return null if username does not exist', async () => {
			const resultAccount = await accountService.findByUsernameAndSystemId(
				'nonExistentUsername',
				mockAccountWithSystemId.systemId ?? ''
			);
			expect(resultAccount).toBeNull();
		});
		it('should return null if system id does not exist', async () => {
			const resultAccount = await accountService.findByUsernameAndSystemId(
				mockAccountWithSystemId.username,
				'nonExistentSystemId' ?? ''
			);
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
		it('should update an existing account', async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.activated = false;
			const ret = await accountService.save(mockTeacherAccountDto);

			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				id: mockTeacherAccount.id,
				username: mockTeacherAccountDto.username,
				activated: mockTeacherAccountDto.activated,
				systemId: mockTeacherAccount.systemId,
				userId: mockTeacherAccount.userId,
			});
		});

		it("should update an existing account's system", async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.systemId = '123456789012';
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
		it("should update an existing account's user", async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.userId = mockStudentUser.id;
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

		it("should keep existing account's system undefined on update", async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			mockTeacherAccountDto.username = 'changedUsername@example.org';
			mockTeacherAccountDto.systemId = undefined;
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
			const ret = await accountService.save(accountToSave);
			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				systemId: undefined,
			});
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
			const ret = await accountService.save(accountToSave);
			expect(ret).toBeDefined();
			expect(ret).not.toMatchObject({
				password: defaultPassword,
			});
		});

		it('should set password to undefined if password is empty while creating a new account', async () => {
			const spy = jest.spyOn(accountRepo, 'save');
			const dto = {
				username: 'john.doe@domain.tld',
				password: '',
			} as AccountDto;
			(accountRepo.findById as jest.Mock).mockClear();
			(accountRepo.save as jest.Mock).mockClear();
			await expect(accountService.save(dto)).resolves.not.toThrow();
			expect(accountRepo.findById).not.toHaveBeenCalled();
			expect(spy).toHaveBeenCalledWith(
				expect.objectContaining({
					password: undefined,
				})
			);
		});

		it('should not change password if password is empty while editing an existing account', async () => {
			const spy = jest.spyOn(accountRepo, 'save');
			const dto = {
				id: mockTeacherAccount.id,
				// username: 'john.doe@domain.tld',
				password: undefined,
			} as AccountDto;
			(accountRepo.findById as jest.Mock).mockClear();
			(accountRepo.save as jest.Mock).mockClear();
			await expect(accountService.save(dto)).resolves.not.toThrow();
			expect(accountRepo.findById).toHaveBeenCalled();
			expect(spy).toHaveBeenCalledWith(
				expect.objectContaining({
					password: defaultPassword,
				})
			);
		});
	});

	describe('updateUsername', () => {
		it('should update an existing account but no other information', async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			const newUsername = 'newUsername';
			const ret = await accountService.updateUsername(mockTeacherAccount.id, newUsername);

			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				...mockTeacherAccountDto,
				username: newUsername,
			});
		});

		it('should update an existing account and set update date', async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			const newUsername = 'newUsername';
			const theNewDate = new Date(2020, 1, 2);
			jest.setSystemTime(theNewDate);
			const ret = await accountService.updateUsername(mockTeacherAccount.id, newUsername);

			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				...mockTeacherAccountDto,
				updatedAt: theNewDate,
				username: newUsername,
			});
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		it('should update last tried failed login', async () => {
			const mockTeacherAccountDto = AccountEntityToDtoMapper.mapToDto(mockTeacherAccount);
			const theNewDate = new Date();
			const ret = await accountService.updateLastTriedFailedLogin(mockTeacherAccount.id, theNewDate);

			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				...mockTeacherAccountDto,
				lasttriedFailedLogin: theNewDate,
			});
		});
	});

	describe('updatePassword', () => {
		it('should update password', async () => {
			const newPassword = 'newPassword';
			const ret = await accountService.updatePassword(mockTeacherAccount.id, newPassword);

			expect(ret).toBeDefined();
			if (ret.password) {
				await expect(bcrypt.compare(newPassword, ret.password)).resolves.toBe(true);
			} else {
				fail('return password is undefined');
			}
		});
	});

	describe('delete', () => {
		it('should delete account via repo', async () => {
			await accountService.delete(mockTeacherAccount.id);
			expect(accountRepo.deleteById).toHaveBeenCalledWith(mockTeacherAccount.id);
		});
	});

	describe('deleteByUserId', () => {
		it('should delete the account with given user id via repo', async () => {
			await accountService.deleteByUserId(mockTeacherAccount.userId?.toString() ?? '');
			expect(accountRepo.deleteByUserId).toHaveBeenCalledWith(mockTeacherAccount.userId);
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
