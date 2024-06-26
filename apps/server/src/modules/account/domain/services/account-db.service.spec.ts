import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdentityManagementService } from '@infra/identity-management';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { IdmAccount } from '@shared/domain/interface';
import { EntityId } from '@shared/domain/types';
import { setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import bcrypt from 'bcryptjs';
import { v1 } from 'uuid';
import { AccountConfig } from '../../account-config';
import { AccountRepo } from '../../repo/micro-orm/account.repo';
import { accountDoFactory } from '../../testing';
import { Account } from '../account';
import { AccountEntity } from '../entity/account.entity';
import { AccountServiceDb } from './account-db.service';

describe('AccountDbService', () => {
	let module: TestingModule;
	let accountService: AccountServiceDb;
	let accountRepo: DeepMocked<AccountRepo>;
	let configServiceMock: DeepMocked<ConfigService>;
	let idmServiceMock: DeepMocked<IdentityManagementService>;

	const defaultPassword = 'DummyPasswd!1';

	const internalId = new ObjectId().toHexString();
	const externalId = v1();
	const accountMock: IdmAccount = {
		id: externalId,
		attDbcAccountId: internalId,
	};

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AccountServiceDb,
				{
					provide: AccountRepo,
					useValue: createMock<AccountRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<AccountConfig, true>>(),
				},
				{
					provide: IdentityManagementService,
					useValue: createMock<IdentityManagementService>(),
				},
			],
		}).compile();
		accountRepo = module.get(AccountRepo);
		accountService = module.get(AccountServiceDb);
		configServiceMock = module.get(ConfigService);
		idmServiceMock = module.get(IdentityManagementService);

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
				const mockTeacherAccount = accountDoFactory.build();
				mockTeacherAccount.username = 'changedUsername@example.org';
				mockTeacherAccount.activated = false;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount };
			};

			it(
				'should return accountDto',
				async () => {
					const { mockTeacherAccount } = setup();

					const resultAccount = await accountService.findById(mockTeacherAccount.id);
					expect(resultAccount).toEqual(mockTeacherAccount);
				},
				10 * 60 * 1000
			);
		});

		describe('when id is external calls idm service', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				mockTeacherAccount.username = 'changedUsername@example.org';
				mockTeacherAccount.activated = false;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				configServiceMock.get.mockReturnValue(true);
				idmServiceMock.findAccountById.mockResolvedValue(accountMock);

				return { mockTeacherAccount };
			};

			it('should return accountDto', async () => {
				const { mockTeacherAccount } = setup();

				const resultAccount = await accountService.findById(externalId);
				expect(resultAccount).toEqual(mockTeacherAccount);
			});
		});
	});

	describe('findByUserId', () => {
		describe('when user id exists', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();

				const mockTeacherAccount = accountDoFactory.build();

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
				expect(resultAccount).toEqual(mockTeacherAccount);
			});
		});

		describe('when user id not exists', () => {
			const setup = () => {
				accountRepo.findByUserId.mockResolvedValue(null);
			};

			it('should return null', async () => {
				setup();
				const resultAccount = await accountService.findByUserId('nonExistentId');
				expect(resultAccount).toBeNull();
			});
		});
	});

	describe('findByUsernameAndSystemId', () => {
		describe('when user name and system id exists', () => {
			const setup = () => {
				const mockAccountWithSystemId = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});
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
				const mockAccountWithSystemId = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});
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
				const mockAccountWithSystemId = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});

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
					'nonExistentSystemId'
				);
				expect(resultAccount).toBeNull();
			});
		});
	});

	describe('findMultipleByUserId', () => {
		describe('when searching for multiple existing ids', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();
				const mockStudentUser = userFactory.buildWithId();
				const mockTeacherAccount = accountDoFactory.build({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});
				const mockStudentAccount = accountDoFactory.build({
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
				expect(resultAccounts).toContainEqual(mockTeacherAccount);
				expect(resultAccounts).toContainEqual(mockStudentAccount);
				expect(resultAccounts).toHaveLength(2);
			});
		});

		describe('when only user name exists', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				const mockStudentAccount = accountDoFactory.build();

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
				const mockTeacherAccount = accountDoFactory.build({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});

				accountRepo.findByUserIdOrFail.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherUser, mockTeacherAccount };
			};

			it('should return accountDto', async () => {
				const { mockTeacherUser, mockTeacherAccount } = setup();
				const resultAccount = await accountService.findByUserIdOrFail(mockTeacherUser.id);
				expect(resultAccount).toEqual(mockTeacherAccount);
			});
		});

		describe('when user does not exist', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();
				const mockTeacherAccount = accountDoFactory.build({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});

				accountRepo.findByUserIdOrFail.mockImplementation((userId: EntityId | ObjectId): Promise<Account> => {
					if (mockTeacherUser.id === userId) {
						return Promise.resolve(mockTeacherAccount);
					}
					throw new EntityNotFoundError(AccountEntity.name);
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
				const mockTeacherAccount = accountDoFactory.build();

				mockTeacherAccount.username = 'changedUsername@example.org';
				mockTeacherAccount.activated = false;
				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount };
			};

			it('should update account', async () => {
				const { mockTeacherAccount } = setup();
				const ret = await accountService.save(mockTeacherAccount);

				expect(accountRepo.save).toBeCalledTimes(1);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					id: mockTeacherAccount.id,
					username: mockTeacherAccount.username,
					activated: mockTeacherAccount.activated,
					systemId: mockTeacherAccount.systemId,
					userId: mockTeacherAccount.userId,
				});
			});
		});

		describe("when update an existing account's system", () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();

				mockTeacherAccount.username = 'changedUsername@example.org';
				mockTeacherAccount.systemId = '123456789012';
				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount };
			};

			it("should update an existing account's system", async () => {
				const { mockTeacherAccount } = setup();

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
		});

		describe("when update an existing account's user", () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				const mockStudentUser = accountDoFactory.build();

				mockTeacherAccount.username = 'changedUsername@example.org';
				mockTeacherAccount.userId = mockStudentUser.id;
				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockStudentUser, mockTeacherAccount };
			};

			it('should update account', async () => {
				const { mockStudentUser, mockTeacherAccount } = setup();

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
		});

		describe("when existing account's system is undefined", () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();

				mockTeacherAccount.username = 'changedUsername@example.org';
				mockTeacherAccount.systemId = undefined;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount };
			};

			it('should keep undefined on update', async () => {
				const { mockTeacherAccount } = setup();

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
		});

		describe('when account does not exists', () => {
			const setup = () => {
				const mockUserWithoutAccount = userFactory.buildWithId();

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

				accountRepo.save.mockResolvedValue(
					new Account({
						id: new ObjectId().toHexString(),
						username: accountToSave.username,
						userId: accountToSave.userId,
						systemId: accountToSave.systemId,
						createdAt: accountToSave.createdAt,
						updatedAt: accountToSave.updatedAt,
					})
				);

				return { accountToSave };
			};

			it('should save a new account', async () => {
				const { accountToSave } = setup();

				const ret = await accountService.save(accountToSave);

				expect(accountRepo.save).toBeCalledTimes(1);
				expect(ret).toBeDefined();
				expect(ret).toBeInstanceOf(Account);
				expect(ret).toMatchObject({
					username: accountToSave.username,
					userId: accountToSave.userId,
					systemId: accountToSave.systemId,
					createdAt: accountToSave.createdAt,
					updatedAt: accountToSave.updatedAt,
				});
			});
		});

		describe("when account's system undefined", () => {
			const setup = () => {
				const mockUserWithoutAccount = userFactory.buildWithId();

				const accountToSave: Account = {
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'asdf@asdf.de',
					userId: mockUserWithoutAccount.id,
					password: defaultPassword,
				} as Account;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				accountRepo.save.mockResolvedValue(
					new Account({
						id: new ObjectId().toHexString(),
						username: accountToSave.username,
						userId: accountToSave.userId,
						createdAt: accountToSave.createdAt,
						updatedAt: accountToSave.updatedAt,
					})
				);

				return { accountToSave };
			};

			it('should keep undefined on save', async () => {
				const { accountToSave } = setup();

				const ret = await accountService.save(accountToSave);
				expect(ret).toBeDefined();
				expect(accountRepo.save).toBeCalledWith(expect.objectContaining({ systemId: undefined }));
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
				} as Account;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				accountRepo.save.mockResolvedValue(
					new Account({
						id: new ObjectId().toHexString(),
						username: accountToSave.username,
						userId: accountToSave.userId,
						createdAt: accountToSave.createdAt,
						updatedAt: accountToSave.updatedAt,
					})
				);

				return { accountToSave };
			};

			it('should encrypt password', async () => {
				const { accountToSave } = setup();

				const ret = await accountService.save(accountToSave);
				expect(ret).toBeDefined();

				expect(accountRepo.save).toBeCalledWith(
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					expect.objectContaining({ password: expect.not.stringMatching(defaultPassword) })
				);
			});
		});

		describe('when save account with id', () => {
			const setup = () => {
				const mockUserWithoutAccount = userFactory.buildWithId();

				const accountToSave = {
					id: new ObjectId().toHexString(),
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'asdf@asdf.de',
					userId: mockUserWithoutAccount.id,
					systemId: '012345678912',
					password: defaultPassword,
				} as Account;
				const accountInRepo = {
					id: new ObjectId().toHexString(),
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'asdf@asdf.de',
					userId: mockUserWithoutAccount.id,
					systemId: '012345678912',
					password: defaultPassword,
				} as Account;
				accountInRepo.update = jest.fn();

				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				accountRepo.findById.mockResolvedValue(accountInRepo);
				accountRepo.save.mockResolvedValue(
					new Account({
						id: new ObjectId().toHexString(),
						username: accountToSave.username,
						userId: accountToSave.userId,
						createdAt: accountToSave.createdAt,
						updatedAt: accountToSave.updatedAt,
					})
				);

				return { accountToSave, accountInRepo };
			};

			it('should encrypt password', async () => {
				const { accountToSave, accountInRepo } = setup();

				const ret = await accountService.save(accountToSave);
				expect(ret).toBeDefined();
				expect(accountInRepo.update).toHaveBeenCalledWith(accountToSave);
			});
		});

		describe('when creating a new account', () => {
			const setup = () => {
				const spy = jest.spyOn(accountRepo, 'save');
				const account = {
					username: 'john.doe@domain.tld',
					password: '',
				} as Account;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				return { spy, account };
			};

			it('should set password to undefined if password is empty', async () => {
				const { spy, account } = setup();

				await expect(accountService.save(account)).resolves.not.toThrow();
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
				const mockTeacherAccount = accountDoFactory.build();

				const spy = jest.spyOn(accountRepo, 'save');
				const account = {
					id: mockTeacherAccount.id,
					password: undefined,
				} as Account;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount, spy, account };
			};

			it('should not change password', async () => {
				const { mockTeacherAccount, spy, account } = setup();
				await expect(accountService.save(account)).resolves.not.toThrow();
				expect(accountRepo.findById).toHaveBeenCalled();
				expect(spy).toHaveBeenCalledWith(
					expect.objectContaining({
						password: mockTeacherAccount.password,
					})
				);
			});
		});

		describe('when username is empty while creating a new account', () => {
			const setup = () => {
				const account = {
					username: '',
					password: defaultPassword,
				} as Account;
				return { account };
			};

			it('should throw an error', async () => {
				const { account } = setup();
				await expect(accountService.save(account)).rejects.toThrow();
			});
		});
	});

	describe('updateUsername', () => {
		describe('when updating username', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				const newUsername = 'newUsername';

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount, newUsername };
			};

			it('should update only user name', async () => {
				const { mockTeacherAccount, newUsername } = setup();
				const ret = await accountService.updateUsername(mockTeacherAccount.id, newUsername);
				expect(ret).toBeDefined();
				expect(ret).toMatchObject({
					...mockTeacherAccount.getProps(),
					username: newUsername,
				});
			});
		});
	});

	describe('updateLastLogin', () => {
		const setup = () => {
			const mockTeacherAccount = accountDoFactory.build();
			const theNewDate = new Date();

			accountRepo.findById.mockResolvedValue(mockTeacherAccount);

			return { mockTeacherAccount, theNewDate };
		};

		it('should update last tried failed login', async () => {
			const { mockTeacherAccount, theNewDate } = setup();

			const ret = await accountService.updateLastLogin(mockTeacherAccount.id, theNewDate);

			expect(ret.lastLogin).toEqual(theNewDate);
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		const setup = () => {
			const mockTeacherAccount = accountDoFactory.build();
			const theNewDate = new Date();

			accountRepo.findById.mockResolvedValue(mockTeacherAccount);

			return { mockTeacherAccount, theNewDate };
		};

		it('should update last tried failed login', async () => {
			const { mockTeacherAccount, theNewDate } = setup();
			const ret = await accountService.updateLastTriedFailedLogin(mockTeacherAccount.id, theNewDate);

			expect(ret.lasttriedFailedLogin).toEqual(theNewDate);
		});
	});

	describe('validatePassword', () => {
		describe('when accepted Password', () => {
			const setup = async () => {
				const ret = await accountService.validatePassword(
					{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as Account,
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
					{ password: await bcrypt.hash(defaultPassword, 10) } as unknown as Account,
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
				const ret = await accountService.validatePassword({ password: undefined } as Account, 'incorrectPwd');

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
				const mockTeacherAccount = accountDoFactory.build();
				const newPassword = 'newPassword';

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);

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
		describe('when delete an existing account', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);

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
				accountRepo.deleteById.mockImplementationOnce(() => {
					throw new EntityNotFoundError(AccountEntity.name);
				});
			};

			it('should throw account not found', async () => {
				setup();
				await expect(accountService.delete('nonExisting')).rejects.toThrow();
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('when delete account with given user id', () => {
			const setup = () => {
				const mockTeacherUser = userFactory.buildWithId();

				const mockTeacherAccount = accountDoFactory.build({
					userId: mockTeacherUser.id,
					password: defaultPassword,
				});

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);

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
				const mockTeacherAccount = accountDoFactory.build();
				const mockStudentAccount = accountDoFactory.build();
				const mockAccountWithSystemId = accountDoFactory.build({
					systemId: new ObjectId().toHexString(),
				});
				const mockAccounts = [mockTeacherAccount, mockStudentAccount, mockAccountWithSystemId];

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.searchByUsernamePartialMatch.mockResolvedValue([
					[mockTeacherAccount, mockStudentAccount, mockAccountWithSystemId],
					3,
				]);

				return { partialUserName, skip, limit, mockTeacherAccount, mockAccounts };
			};

			it('should call repo', async () => {
				const { partialUserName, skip, limit, mockTeacherAccount, mockAccounts } = setup();
				const [accounts, total] = await accountService.searchByUsernamePartialMatch(partialUserName, skip, limit);
				expect(accountRepo.searchByUsernamePartialMatch).toHaveBeenCalledWith(partialUserName, skip, limit);
				expect(total).toBe(mockAccounts.length);

				expect(accounts[0]).toEqual(mockTeacherAccount);
			});
		});
	});

	describe('searchByUsernameExactMatch', () => {
		describe('when searching by username', () => {
			const setup = () => {
				const partialUserName = 'admin';
				const mockTeacherAccount = accountDoFactory.build();

				accountRepo.searchByUsernameExactMatch.mockResolvedValue([[mockTeacherAccount], 1]);

				return { partialUserName, mockTeacherAccount };
			};

			it('should call repo', async () => {
				const { partialUserName, mockTeacherAccount } = setup();
				const [accounts, total] = await accountService.searchByUsernameExactMatch(partialUserName);
				expect(accountRepo.searchByUsernameExactMatch).toHaveBeenCalledWith(partialUserName);
				expect(total).toBe(1);
				expect(accounts[0]).toEqual(mockTeacherAccount);
			});
		});
	});
	describe('findMany', () => {
		describe('when find many one time', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();

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
				const mockTeacherAccount = accountDoFactory.build();

				accountRepo.findMany.mockResolvedValue([mockTeacherAccount]);

				return {};
			};

			it('should call repo each time', async () => {
				setup();
				const foundAccounts = await accountService.findMany();
				expect(accountRepo.findMany).toHaveBeenCalledWith(0, 100);
				expect(foundAccounts).toBeDefined();
			});
		});
	});
});
