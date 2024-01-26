import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdentityManagementService } from '@infra/identity-management/identity-management.service';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountEntityToDtoMapper } from '@modules/account/mapper';
import { AccountDto } from '@modules/account/services/dto';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { Account, Role, SchoolEntity, User } from '@shared/domain/entity';

import { Permission, RoleName } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { accountFactory, schoolEntityFactory, setupEntities, userFactory } from '@shared/testing';
import bcrypt from 'bcryptjs';
import { LegacyLogger } from '../../../core/logger';
import { AccountRepo } from '../repo/account.repo';
import { AccountServiceDb } from './account-db.service';
import { AccountLookupService } from './account-lookup.service';
import { AbstractAccountService } from './account.service.abstract';

describe('AccountDbService', () => {
	let module: TestingModule;
	let accountService: AbstractAccountService;
	let mockAccounts: Account[];
	let accountRepo: AccountRepo;
	let accountLookupServiceMock: DeepMocked<AccountLookupService>;

	const defaultPassword = 'DummyPasswd!1';

	let mockSchool: SchoolEntity;

	let mockTeacherUser: User;
	let mockStudentUser: User;
	let mockUserWithoutAccount: User;

	let mockTeacherAccount: Account;
	let mockStudentAccount: Account;

	let mockAccountWithSystemId: Account;

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
						deleteById: jest.fn().mockImplementation((): Promise<void> => Promise.resolve()),
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

						findById: jest.fn().mockImplementation((accountId: EntityId | ObjectId): Promise<Account> => {
							const account = mockAccounts.find((tempAccount) => tempAccount.id === accountId.toString());

							if (account) {
								return Promise.resolve(account);
							}
							throw new EntityNotFoundError(Account.name);
						}),
						searchByUsernameExactMatch: jest
							.fn()
							.mockImplementation((): Promise<[Account[], number]> => Promise.resolve([[mockTeacherAccount], 1])),
						searchByUsernamePartialMatch: jest
							.fn()
							.mockImplementation(
								(): Promise<[Account[], number]> => Promise.resolve([mockAccounts, mockAccounts.length])
							),
						deleteByUserId: jest.fn().mockImplementation((): Promise<void> => Promise.resolve()),
						findMany: jest.fn().mockImplementation((): Promise<Account[]> => Promise.resolve(mockAccounts)),
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

		mockSchool = schoolEntityFactory.buildWithId();

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
		it(
			'should return accountDto',
			async () => {
				const resultAccount = await accountService.findById(mockTeacherAccount.id);
				expect(resultAccount).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
			},
			10 * 60 * 1000
		);
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

	describe('validatePassword', () => {
		it('should validate password', async () => {
			const ret = await accountService.validatePassword(
				{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as AccountDto,
				defaultPassword
			);
			expect(ret).toBe(true);
		});
		it('should report wrong password', async () => {
			const ret = await accountService.validatePassword(
				{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as AccountDto,
				'incorrectPwd'
			);
			expect(ret).toBe(false);
		});
		it('should report missing account password', async () => {
			const ret = await accountService.validatePassword({ password: undefined } as AccountDto, 'incorrectPwd');
			expect(ret).toBe(false);
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
		describe('when deleting existing account', () => {
			it('should delete account via repo', async () => {
				await accountService.delete(mockTeacherAccount.id);
				expect(accountRepo.deleteById).toHaveBeenCalledWith(new ObjectId(mockTeacherAccount.id));
			});
		});

		describe('when deleting non existing account', () => {
			const setup = () => {
				accountLookupServiceMock.getInternalId.mockResolvedValueOnce(null);
			};

			it('should throw', async () => {
				setup();
				await expect(accountService.delete(mockTeacherAccount.id)).rejects.toThrow();
			});
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
			const [accounts, total] = await accountService.searchByUsernamePartialMatch(partialUserName, skip, limit);
			expect(accountRepo.searchByUsernamePartialMatch).toHaveBeenCalledWith(partialUserName, skip, limit);
			expect(total).toBe(mockAccounts.length);

			expect(accounts[0]).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
		});
	});
	describe('searchByUsernameExactMatch', () => {
		it('should call repo', async () => {
			const partialUserName = 'admin';
			const [accounts, total] = await accountService.searchByUsernameExactMatch(partialUserName);
			expect(accountRepo.searchByUsernameExactMatch).toHaveBeenCalledWith(partialUserName);
			expect(total).toBe(1);
			expect(accounts[0]).toEqual(AccountEntityToDtoMapper.mapToDto(mockTeacherAccount));
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
