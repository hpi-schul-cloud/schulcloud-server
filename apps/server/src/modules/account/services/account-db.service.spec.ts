import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { AccountEntity, Role, SchoolEntity, User } from '@shared/domain/entity';
import { IdentityManagementService } from '@src/infra/identity-management';

import { Permission, RoleName } from '@shared/domain/interface';
import { Counted, EntityId } from '@shared/domain/types';
import { accountEntityFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import bcrypt from 'bcryptjs';
import { LegacyLogger } from '../../../core/logger';
import { AccountRepo } from '../repo/account.repo';
import { AccountEntityToDoMapper } from '../repo/mapper';
import { AccountServiceDb } from './account-db.service';
import { AccountLookupService } from './account-lookup.service';
import { AbstractAccountService } from './account.service.abstract';
import { Account } from '../domain';

describe('AccountDbService', () => {
	let module: TestingModule;
	let accountService: AbstractAccountService;
	let mockAccounts: AccountEntity[];
	let accountRepo: AccountRepo;
	let accountLookupServiceMock: DeepMocked<AccountLookupService>;

	const defaultPassword = 'DummyPasswd!1';

	let mockSchool: SchoolEntity;

	let mockTeacherUser: User;
	let mockStudentUser: User;
	let mockUserWithoutAccount: User;

	let mockTeacherAccountEntity: AccountEntity;
	let mockStudentAccountEntity: AccountEntity;

	let mockAccountWithSystemIdEntity: AccountEntity;

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
					useValue: {
						save: jest.fn().mockImplementation((account: AccountEntity): Promise<void> => {
							if (account.username === 'fail@to.update') {
								return Promise.reject();
							}
							const accountEntity = mockAccounts.find((tempAccount) => tempAccount.userId === account.userId);
							if (accountEntity) {
								Object.assign(accountEntity, account);
							}

							return Promise.resolve();
						}),
						deleteById: jest.fn().mockImplementation((): Promise<void> => Promise.resolve()),
						findMultipleByUserId: (userIds: EntityId[]): Promise<AccountEntity[]> => {
							const accounts = mockAccounts.filter((tempAccount) =>
								userIds.find((userId) => tempAccount.userId?.toString() === userId)
							);
							return Promise.resolve(accounts);
						},
						findByUserId: (userId: EntityId): Promise<AccountEntity | null> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId?.toString() === userId);
							if (account) {
								return Promise.resolve(account);
							}
							return Promise.resolve(null);
						},
						findByUserIdOrFail: (userId: EntityId): Promise<AccountEntity> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.userId?.toString() === userId);

							if (account) {
								return Promise.resolve(account);
							}
							throw new EntityNotFoundError(AccountEntity.name);
						},
						findByUsernameAndSystemId: (
							username: string,
							systemId: EntityId | ObjectId
						): Promise<AccountEntity | null> => {
							const account = mockAccounts.find(
								(tempAccount) => tempAccount.username === username && tempAccount.systemId === systemId
							);
							if (account) {
								return Promise.resolve(account);
							}
							return Promise.resolve(null);
						},

						findById: jest.fn().mockImplementation((accountId: EntityId | ObjectId): Promise<AccountEntity> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.id === accountId.toString());

							if (account) {
								return Promise.resolve(account);
							}
							throw new EntityNotFoundError(AccountEntity.name);
						}),
						searchByUsernameExactMatch: jest
							.fn()
							.mockImplementation((): Promise<Counted<AccountEntity[]>> => Promise.resolve([[mockTeacherAccountEntity], 1])),
						searchByUsernamePartialMatch: jest
							.fn()
							.mockImplementation(
								(): Promise<Counted<AccountEntity[]>> => Promise.resolve([mockAccounts, mockAccounts.length])
							),
						deleteByUserId: jest.fn().mockImplementation((): Promise<void> => Promise.resolve()),
						findMany: jest.fn().mockImplementation((): Promise<AccountEntity[]> => Promise.resolve(mockAccounts)),
					},
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>(),
				},
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
				{
					provide: AccountLookupService,
					useValue: createMock<AccountLookupService>({
						getInternalId: (id: EntityId | ObjectId): Promise<ObjectId | null> => {
							if (ObjectId.isValid(id)) {
								return Promise.resolve(new ObjectId(id));
							}
							return Promise.resolve(null);
						},
					}),
				},
			],
		}).compile();
		accountRepo = module.get(AccountRepo);
		accountService = module.get(AccountServiceDb);
		accountLookupServiceMock = module.get(AccountLookupService);
		await setupEntities();
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
		mockTeacherAccountEntity = accountEntityFactory.buildWithId({ userId: mockTeacherUser.id, password: defaultPassword });
		mockStudentAccountEntity = accountEntityFactory.buildWithId({ userId: mockStudentUser.id, password: defaultPassword });

		mockAccountWithSystemIdEntity = accountEntityFactory.withSystemId(new ObjectId()).build();
		mockAccounts = [mockTeacherAccountEntity, mockStudentAccountEntity, mockAccountWithSystemIdEntity];
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe('findById', () => {
		it(
			'should return accountDto',
			async () => {
				const resultAccount = await accountService.findById(mockTeacherAccountEntity.id);
				expect(resultAccount).toEqual(AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity));
			},
			10 * 60 * 1000
		);
	});

	describe('findByUserId', () => {
		it('should return accountDto', async () => {
			const resultAccount = await accountService.findByUserId(mockTeacherUser.id);
			expect(resultAccount).toEqual(AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity));
		});
		it('should return null', async () => {
			const resultAccount = await accountService.findByUserId('nonExistentId');
			expect(resultAccount).toBeNull();
		});
	});

	describe('findByUsernameAndSystemId', () => {
		it('should return accountDto', async () => {
			const resultAccount = await accountService.findByUsernameAndSystemId(
				mockAccountWithSystemIdEntity.username,
				mockAccountWithSystemIdEntity.systemId ?? ''
			);
			expect(resultAccount).not.toBe(undefined);
		});
		it('should return null if username does not exist', async () => {
			const resultAccount = await accountService.findByUsernameAndSystemId(
				'nonExistentUsername',
				mockAccountWithSystemIdEntity.systemId ?? ''
			);
			expect(resultAccount).toBeNull();
		});
		it('should return null if system id does not exist', async () => {
			const resultAccount = await accountService.findByUsernameAndSystemId(
				mockAccountWithSystemIdEntity.username,
				'nonExistentSystemId' ?? ''
			);
			expect(resultAccount).toBeNull();
		});
	});

	describe('findMultipleByUserId', () => {
		it('should return multiple accountDtos', async () => {
			const resultAccounts = await accountService.findMultipleByUserId([mockTeacherUser.id, mockStudentUser.id]);
			expect(resultAccounts).toContainEqual(AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity));
			expect(resultAccounts).toContainEqual(AccountEntityToDoMapper.mapToDo(mockStudentAccountEntity));
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
			expect(resultAccount).toEqual(AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity));
		});
		it('should throw EntityNotFoundError', async () => {
			await expect(accountService.findByUserIdOrFail('nonExistentId')).rejects.toThrow(EntityNotFoundError);
		});
	});

	describe('save', () => {
		it('should update an existing account', async () => {
			const mockTeacherAccount = AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity);
			mockTeacherAccount.username = 'changedUsername@example.org';
			mockTeacherAccount.activated = false;
			const ret = await accountService.save(mockTeacherAccount);

			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				id: mockTeacherAccount.id,
				username: mockTeacherAccount.username,
				activated: mockTeacherAccount.activated,
				systemId: mockTeacherAccount.systemId,
				userId: mockTeacherAccount.userId,
			});
		});

		it("should update an existing account's system", async () => {
			const mockTeacherAccount = AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity);
			mockTeacherAccount.username = 'changedUsername@example.org';
			mockTeacherAccount.systemId = '123456789012';
			const ret = await accountService.save(mockTeacherAccount);
			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				id: mockTeacherAccount.id,
				username: mockTeacherAccount.username,
				activated: mockTeacherAccount.activated,
				systemId: new ObjectId(mockTeacherAccount.systemId),
				userId: mockTeacherAccount.userId,
			});
		});
		it("should update an existing account's user", async () => {
			const mockTeacherAccount = AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity);
			mockTeacherAccount.username = 'changedUsername@example.org';
			mockTeacherAccount.userId = mockStudentUser.id;
			const ret = await accountService.save(mockTeacherAccount);
			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				id: mockTeacherAccount.id,
				username: mockTeacherAccount.username,
				activated: mockTeacherAccount.activated,
				systemId: mockTeacherAccount.systemId,
				userId: new ObjectId(mockStudentUser.id),
			});
		});

		it("should keep existing account's system undefined on update", async () => {
			const mockTeacherAccount = AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity);
			mockTeacherAccount.username = 'changedUsername@example.org';
			mockTeacherAccount.systemId = undefined;
			const ret = await accountService.save(mockTeacherAccount);
			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				id: mockTeacherAccountEntity.id,
				username: mockTeacherAccount.username,
				activated: mockTeacherAccountEntity.activated,
				systemId: mockTeacherAccount.systemId,
				userId: mockTeacherAccountEntity.userId,
			});
		});
		it('should save a new account', async () => {
			const accountToSave: Account = {
				createdAt: new Date(),
				updatedAt: new Date(),
				username: 'asdf@asdf.de',
				userId: mockUserWithoutAccount.id,
				systemId: '012345678912',
				password: defaultPassword,
			} as Account;
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
			const accountToSave: Account = {
				createdAt: new Date(),
				updatedAt: new Date(),
				username: 'asdf@asdf.de',
				userId: mockUserWithoutAccount.id,
				password: defaultPassword,
			} as Account;
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
			} as Account;
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
			} as Account;
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
				id: mockTeacherAccountEntity.id,
				// username: 'john.doe@domain.tld',
				password: undefined,
			} as Account;
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
			const mockTeacherAccount = AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity);
			const newUsername = 'newUsername';
			const ret = await accountService.updateUsername(mockTeacherAccountEntity.id, newUsername);

			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				...mockTeacherAccount,
				username: newUsername,
			});
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		it('should update last tried failed login', async () => {
			const mockTeacherAccount = AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity);
			const theNewDate = new Date();
			const ret = await accountService.updateLastTriedFailedLogin(mockTeacherAccountEntity.id, theNewDate);

			expect(ret).toBeDefined();
			expect(ret).toMatchObject({
				...mockTeacherAccount,
				lasttriedFailedLogin: theNewDate,
			});
		});
	});

	describe('validatePassword', () => {
		it('should validate password', async () => {
			const ret = await accountService.validatePassword(
				{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as Account,
				defaultPassword
			);
			expect(ret).toBe(true);
		});
		it('should report wrong password', async () => {
			const ret = await accountService.validatePassword(
				{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as Account,
				'incorrectPwd'
			);
			expect(ret).toBe(false);
		});
		it('should report missing account password', async () => {
			const ret = await accountService.validatePassword({ password: undefined } as Account, 'incorrectPwd');
			expect(ret).toBe(false);
		});
	});

	describe('updatePassword', () => {
		it('should update password', async () => {
			const newPassword = 'newPassword';
			const ret = await accountService.updatePassword(mockTeacherAccountEntity.id, newPassword);

			expect(ret).toBeDefined();
			if (ret.password) {
				await expect(bcrypt.compare(newPassword, ret.password)).resolves.toBe(true);
			} else {
				fail('return password is undefined');
			}
		});
	});

	describe('delete', () => {
		describe('when deleting existing account', () => {
			it('should delete account via repo', async () => {
				await accountService.delete(mockTeacherAccountEntity.id);
				expect(accountRepo.deleteById).toHaveBeenCalledWith(new ObjectId(mockTeacherAccountEntity.id));
			});
		});

		describe('when deleting non existing account', () => {
			const setup = () => {
				accountLookupServiceMock.getInternalId.mockResolvedValueOnce(null);
			};

			it('should throw', async () => {
				setup();
				await expect(accountService.delete(mockTeacherAccountEntity.id)).rejects.toThrow();
			});
		});
	});

	describe('deleteByUserId', () => {
		it('should delete the account with given user id via repo', async () => {
			await accountService.deleteByUserId(mockTeacherAccountEntity.userId?.toString() ?? '');
			expect(accountRepo.deleteByUserId).toHaveBeenCalledWith(mockTeacherAccountEntity.userId);
		});
	});

	describe('searchByUsernamePartialMatch', () => {
		it('should call repo', async () => {
			const partialUserName = 'admin';
			const skip = 2;
			const limit = 10;
			const [accounts, total] = await accountService.searchByUsernamePartialMatch(partialUserName, skip, limit);
			expect(accountRepo.searchByUsernamePartialMatch).toHaveBeenCalledWith(partialUserName, skip, limit);
			expect(total).toBe(mockAccounts.length);

			expect(accounts[0]).toEqual(AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity));
		});
	});
	describe('searchByUsernameExactMatch', () => {
		it('should call repo', async () => {
			const partialUserName = 'admin';
			const [accounts, total] = await accountService.searchByUsernameExactMatch(partialUserName);
			expect(accountRepo.searchByUsernameExactMatch).toHaveBeenCalledWith(partialUserName);
			expect(total).toBe(1);
			expect(accounts[0]).toEqual(AccountEntityToDoMapper.mapToDo(mockTeacherAccountEntity));
		});
	});

	describe('findMany', () => {
		it('should call repo', async () => {
			const foundAccounts = await accountService.findMany(1, 1);
			expect(accountRepo.findMany).toHaveBeenCalledWith(1, 1);
			expect(foundAccounts).toBeDefined();
		});
		it('should call repo', async () => {
			const foundAccounts = await accountService.findMany();
			expect(accountRepo.findMany).toHaveBeenCalledWith(0, 100);
			expect(foundAccounts).toBeDefined();
		});
	});
});
