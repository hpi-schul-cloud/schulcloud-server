import { faker } from '@faker-js/faker';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { systemFactory } from '@modules/system/testing';
import { User, UserService } from '@modules/user';
import { userFactory } from '@modules/user/testing';
import { Test, type TestingModule } from '@nestjs/testing';
import {
	AuthorizationError,
	EntityNotFoundError,
	ForbiddenOperationError,
	ValidationError,
} from '@shared/common/error';
import type { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import bcrypt from 'bcryptjs';
import 'reflect-metadata';
import { accountDoFactory, accountFactory } from '../../testing';
import { Account, type AccountSave, type UpdateAccount } from '../do';
import { ACCOUNT_REPO, type AccountRepo } from '../interface';
import { AccountService } from './account.service';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let userService: DeepMocked<UserService>;
	let accountRepo: DeepMocked<AccountRepo>;

	const defaultPassword = 'DummyPasswd!1';
	const otherPassword = 'DummyPasswd!2';
	const defaultPasswordHash = '$2b$10$6T0nBt.BOXd1/LRPUILcFe8M9Wo6NRudHHcPK1je6SyayjCh9u4i6';

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				AccountService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ACCOUNT_REPO,
					useValue: createMock<AccountRepo>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();
		accountService = module.get(AccountService);
		userService = module.get(UserService);
		accountRepo = module.get(ACCOUNT_REPO);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
		jest.resetAllMocks();
		jest.resetModules();
	});

	it('should be defined', () => {
		expect(accountService).toBeDefined();
	});

	describe('findById', () => {
		describe('When calling findById in accountService', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				mockTeacherAccount.username = 'changedUsername@example.org';
				mockTeacherAccount.activated = false;

				accountRepo.findById.mockResolvedValueOnce(mockTeacherAccount);

				return { mockTeacherAccount };
			};

			it('should return accountDto', async () => {
				const { mockTeacherAccount } = setup();

				const resultAccount = await accountService.findById(mockTeacherAccount.id);

				expect(accountRepo.findById).toHaveBeenCalledTimes(1);
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

				expect(resultAccount).toBeDefined();
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
					return Promise.reject(new EntityNotFoundError('AccountEntity'));
				});

				return {};
			};

			it('should throw EntityNotFoundError', async () => {
				setup();

				await expect(accountService.findByUserIdOrFail('nonExistentId')).rejects.toBeInstanceOf(EntityNotFoundError);
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

				expect(accountRepo.save).toHaveBeenCalledTimes(1);
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
				const { mockTeacherAccount } = setup();

				const ret = await accountService.save(mockTeacherAccount);

				expect(ret).toBeDefined();
				expect(ret).toEqual(mockTeacherAccount);
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

				expect(accountRepo.save).toHaveBeenCalledTimes(1);
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
				expect(accountRepo.save).toHaveBeenCalledWith(expect.objectContaining({ systemId: undefined }));
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
				expect(accountRepo.save).toHaveBeenCalledWith(
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
				const accountInRepo = new Account({
					id: new ObjectId().toHexString(),
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'asdf@asdf.de',
					userId: mockUserWithoutAccount.id,
					systemId: '012345678912',
					password: defaultPassword,
				});

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
				const { accountToSave } = setup();

				const ret = await accountService.save(accountToSave);

				expect(ret).toBeDefined();
				expect(accountRepo.findById).toHaveBeenCalled();
				expect(accountRepo.save).toHaveBeenCalledTimes(1);

				const savedAccount = accountRepo.save.mock.calls[0][0] as Account;
				expect(savedAccount.password).toBeDefined();
				expect(savedAccount.password).not.toBe(defaultPassword);
				if (savedAccount.password) {
					await expect(bcrypt.compare(defaultPassword, savedAccount.password)).resolves.toBe(true);
				}
			});
		});

		describe('when creating a new account', () => {
			const setup = () => {
				const account = {
					username: 'john.doe@domain.tld',
					password: '',
				} as Account;
				(accountRepo.findById as jest.Mock).mockClear();
				(accountRepo.save as jest.Mock).mockClear();

				accountRepo.save.mockResolvedValue(
					new Account({
						id: new ObjectId().toHexString(),
						username: account.username,
						password: undefined,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
				);

				return { account };
			};

			it('should set password to undefined if password is empty', async () => {
				const { account } = setup();

				await expect(accountService.save(account)).resolves.not.toThrow();
				expect(accountRepo.findById).not.toHaveBeenCalled();
				expect(accountRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						password: undefined,
					})
				);
			});
		});

		describe('when password is empty while editing an existing account', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();

				const account = {
					id: mockTeacherAccount.id,
					password: undefined,
				} as Account;

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount, account };
			};

			it('should not change password', async () => {
				const { mockTeacherAccount, account } = setup();

				await expect(accountService.save(account)).resolves.not.toThrow();
				expect(accountRepo.findById).toHaveBeenCalled();
				expect(accountRepo.save).toHaveBeenCalledWith(
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

	describe('saveAll', () => {
		describe('when given account that does not exist', () => {
			const setup = () => {
				const account = accountDoFactory.build({
					id: undefined,
				});
				const savedAccount = accountDoFactory.build({
					...account,
					id: new ObjectId().toHexString(),
				});

				accountRepo.saveAll.mockResolvedValueOnce([savedAccount]);

				return { account, savedAccount };
			};

			it('should save it', async () => {
				const { account, savedAccount } = setup();
				const result = await accountService.saveAll([account]);

				expect(result).toStrictEqual([savedAccount]);
			});
		});

		describe('when given account that exist', () => {
			const setup = () => {
				const account = accountDoFactory.build();
				const foundAccount = accountDoFactory.build();

				accountRepo.findById.mockResolvedValueOnce(foundAccount);
				accountRepo.saveAll.mockResolvedValueOnce([foundAccount]);

				return { account, foundAccount };
			};

			it('should update it', async () => {
				const { account, foundAccount } = setup();

				const result = await accountService.saveAll([account]);

				expect(accountRepo.findById).toHaveBeenCalledTimes(1);
				expect(accountRepo.saveAll).toHaveBeenCalledTimes(1);
				expect(accountRepo.saveAll).toHaveBeenCalledWith(
					expect.arrayContaining([expect.objectContaining({ id: foundAccount.id })])
				);
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe(foundAccount.id);
			});
		});
	});

	describe('saveWithValidation', () => {
		describe('When calling with an empty username', () => {
			it('should throw an ValidationError', async () => {
				const params: AccountSave = {
					username: '',
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).rejects.toThrow(ValidationError);
			});
		});

		describe('When calling saveWithValidation on accountService', () => {
			const setup = () => {
				accountRepo.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				accountRepo.findByUsername.mockResolvedValueOnce(null);
			};

			it('should not sanitize username for external user', async () => {
				setup();

				const params: AccountSave = {
					username: ' John.Doe@domain.tld ',
					systemId: new ObjectId().toHexString(),
				} as AccountSave;

				await accountService.saveWithValidation(params);

				expect(accountRepo.findByUsername).toHaveBeenCalledWith(' John.Doe@domain.tld ');
				expect(accountRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						username: ' John.Doe@domain.tld ',
					})
				);
			});
		});

		describe('When username for a local user is not an email', () => {
			it('should throw username is not an email error', async () => {
				const params: AccountSave = {
					username: 'John Doe',
					password: 'JohnsPassword_123',
				} as AccountSave;

				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username is not an email');
			});
		});

		describe('When username for an external user is not an email', () => {
			const setup = () => {
				accountRepo.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				accountRepo.findByUsername.mockResolvedValueOnce(null);
			};

			it('should not throw an error', async () => {
				setup();
				const params: AccountSave = {
					username: 'John Doe',
					systemId: new ObjectId().toHexString(),
				} as AccountSave;

				await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('John Doe');
			});
		});

		describe('When username for an external user is a ldap search string', () => {
			const setup = () => {
				accountRepo.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				accountRepo.findByUsername.mockResolvedValueOnce(null);
			};

			it('should not throw an error', async () => {
				setup();
				const params: AccountSave = {
					username: 'dc=schul-cloud,dc=org/fake.ldap',
					systemId: new ObjectId().toHexString(),
				} as AccountSave;

				await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('dc=schul-cloud,dc=org/fake.ldap');
			});
		});

		describe('When no password is provided for an internal user', () => {
			it('should throw no password provided error', async () => {
				const params: AccountSave = {
					username: 'john.doe@mail.tld',
				} as AccountSave;

				await expect(accountService.saveWithValidation(params)).rejects.toThrow('No password provided');
			});
		});

		describe('When account already exists', () => {
			it('should throw account already exists', async () => {
				const params: AccountSave = {
					username: 'john.doe@mail.tld',
					password: 'JohnsPassword_123',
					userId: new ObjectId().toHexString(),
				} as AccountSave;
				accountRepo.findByUserId.mockResolvedValueOnce({ id: 'foundAccount123' } as Account);

				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Account already exists');
			});
		});

		describe('When username already exists in mongoDB', () => {
			const setup = () => {
				accountRepo.findByUsername.mockResolvedValueOnce(accountDoFactory.build({ username: 'john.doe@mail.tld' }));
			};

			it('should throw username already exists', async () => {
				setup();
				const params: AccountSave = {
					username: 'john.doe@mail.tld',
					password: 'JohnsPassword_123',
				} as AccountSave;

				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username already exists');
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('john.doe@mail.tld');
			});
		});
	});

	describe('validateAccountBeforeSaveOrReject', () => {
		describe('when username is empty', () => {
			it('should throw ValidationError', async () => {
				const accountSave = { username: '', password: 'pw', systemId: undefined } as AccountSave;

				await expect(accountService.validateAccountBeforeSaveOrReject(accountSave)).rejects.toThrow(ValidationError);
			});
		});

		describe('when password is missing for local user', () => {
			it('should throw ValidationError', async () => {
				const accountSave = { username: 'test@mail.com', password: undefined, systemId: undefined } as AccountSave;

				await expect(accountService.validateAccountBeforeSaveOrReject(accountSave)).rejects.toThrow(ValidationError);
			});
		});

		describe('when username is not an email for local user', () => {
			it('should throw ValidationError', async () => {
				const accountSave = { username: 'not-an-email', password: 'pw', systemId: undefined } as AccountSave;

				await expect(accountService.validateAccountBeforeSaveOrReject(accountSave)).rejects.toThrow(ValidationError);
			});
		});

		describe('when account already exists', () => {
			it('should throw ValidationError', async () => {
				const accountSave = {
					username: 'exists@mail.com',
					password: 'pw',
					userId: 'user1',
					systemId: undefined,
				} as AccountSave;
				accountRepo.findByUserId.mockResolvedValueOnce(accountDoFactory.build());

				await expect(accountService.validateAccountBeforeSaveOrReject(accountSave)).rejects.toThrow(ValidationError);
				expect(accountRepo.findByUserId).toHaveBeenCalledWith(accountSave.userId);
			});
		});

		describe('when username is not unique', () => {
			it('should throw ValidationError', async () => {
				const accountSave = { username: 'notunique@mail.com', password: 'pw', systemId: undefined } as AccountSave;
				accountRepo.findByUsername.mockResolvedValueOnce(accountDoFactory.build({ username: 'notunique@mail.com' }));

				await expect(accountService.validateAccountBeforeSaveOrReject(accountSave)).rejects.toThrow(ValidationError);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('notunique@mail.com');
			});
		});

		describe('when username is sanitized for local user', () => {
			it('should sanitize username', async () => {
				const accountSave = { username: 'Test@Mail.com ', password: 'pw', systemId: undefined } as AccountSave;
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				await expect(accountService.validateAccountBeforeSaveOrReject(accountSave)).resolves.not.toThrow();
				expect(accountSave.username).toBe('test@mail.com');
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('test@mail.com');
				expect(accountRepo.findByUserId).not.toHaveBeenCalled();
			});
		});

		describe('when allowUpdate is true', () => {
			it('should not throw ValidationError for valid update', async () => {
				const accountSave = {
					username: 'valid@mail.com',
					password: 'pw',
					systemId: undefined,
					userId: 'user1',
				} as AccountSave;

				accountRepo.findByUsername.mockResolvedValueOnce(null);

				await expect(
					accountService.validateAccountBeforeSaveOrReject(accountSave, { allowUpdate: true })
				).resolves.not.toThrow();
				expect(accountRepo.findByUserId).not.toHaveBeenCalled();
			});
		});
	});

	describe('updateUsername', () => {
		describe('when updating username', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				const newUsername = 'newUsername';

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockImplementation((account: Account) => Promise.resolve(account));

				return { mockTeacherAccount, newUsername };
			};

			it('should update only user name', async () => {
				const { mockTeacherAccount, newUsername } = setup();
				const ret = await accountService.updateUsername(mockTeacherAccount.id, newUsername);

				expect(ret).toBeDefined();
				expect(ret.getProps()).toMatchObject({
					...mockTeacherAccount.getProps(),
					username: newUsername,
				});
			});
		});
	});

	describe('updateLastLogin', () => {
		describe('When calling updateLastLogin in accountService', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				const theNewDate = new Date();

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount, theNewDate };
			};

			it('should update last login', async () => {
				const { mockTeacherAccount, theNewDate } = setup();

				await accountService.updateLastLogin(mockTeacherAccount.id, theNewDate);

				expect(mockTeacherAccount.lastLogin).toEqual(theNewDate);
			});
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		describe('When calling updateLastTriedFailedLogin in accountService', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				const theNewDate = new Date();

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);

				return { mockTeacherAccount, theNewDate };
			};

			it('should update last tried failed login', async () => {
				const { mockTeacherAccount, theNewDate } = setup();
				const ret = await accountService.updateLastTriedFailedLogin(mockTeacherAccount.id, theNewDate);

				expect(ret.lasttriedFailedLogin).toEqual(theNewDate);
			});
		});
	});

	describe('updatePassword', () => {
		describe('when update Password', () => {
			const setup = () => {
				const mockTeacherAccount = accountDoFactory.build();
				const newPassword = 'newPassword';

				accountRepo.findById.mockResolvedValue(mockTeacherAccount);
				accountRepo.save.mockResolvedValue(mockTeacherAccount);
				return { mockTeacherAccount, newPassword };
			};

			it('should update password', async () => {
				const { mockTeacherAccount, newPassword } = setup();

				const ret = await accountService.updatePassword(mockTeacherAccount.id, newPassword);

				expect(ret).toBeDefined();
				if (ret.password) {
					await expect(bcrypt.compare(newPassword, ret.password)).resolves.toBe(true);
				}
			});
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
					throw new EntityNotFoundError('AccountEntity');
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

	describe('updateMyAccount', () => {
		describe('When account is external', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockExternalUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const externalSystem = systemFactory.build();
				const mockExternalAccount = accountDoFactory.build({
					userId: mockExternalUser.id,
					password: defaultPasswordHash,
					systemId: externalSystem.id,
				});

				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockExternalAccount);

				return { mockExternalUser, mockExternalAccount };
			};

			it('should throw ForbiddenOperationError', async () => {
				const { mockExternalUser, mockExternalAccount } = setup();

				await expect(
					accountService.updateMyAccount(mockExternalUser, mockExternalAccount, {
						passwordOld: defaultPassword,
					})
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When password does not match', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccount = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccount);

				return { mockStudentUser, mockStudentAccount };
			};

			it('should throw AuthorizationError', async () => {
				const { mockStudentUser, mockStudentAccount } = setup();
				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccount, {
						passwordOld: 'DoesNotMatch',
					})
				).rejects.toThrow(AuthorizationError);
			});
		});

		describe('When new password is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValue(mockStudentAccountDo);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should allow to update with strong password', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						passwordNew: otherPassword,
					})
				).resolves.not.toThrow();
			});
		});

		describe('When no new password is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValue(mockStudentAccountDo);

				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should not update password', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				await accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
					passwordOld: defaultPassword,
					passwordNew: undefined,
					email: 'newemail@to.update',
				});

				expect(accountRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						props: expect.objectContaining({
							password: mockStudentAccountDo.password,
						}),
					})
				);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('newemail@to.update');
			});
		});

		describe('When a new email is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValue(mockStudentAccountDo);
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should allow to update email', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: 'an@available.mail',
					})
				).resolves.not.toThrow();
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('an@available.mail');
			});
		});

		describe('When email is not lowercase', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findByUsername.mockResolvedValueOnce(null);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValue(mockStudentAccountDo);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should use email as account user name in lower case', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();

				const testMail = 'AN@AVAILABLE.MAIL';

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(accountRepo.save).toHaveBeenCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
				expect(accountRepo.findByUsername).toHaveBeenCalledWith(testMail.toLowerCase());
			});
		});

		describe('When email is not lowercase', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValue(mockStudentAccountDo);
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should use email as user email in lower case', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const testMail = 'AN@AVAILABLE.MAIL';

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(userService.saveEntity).toHaveBeenCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
				expect(accountRepo.findByUsername).toHaveBeenCalledWith(testMail.toLowerCase());
			});
		});

		describe('When email is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValue(mockStudentAccountDo);
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should always update account user name AND user email together.', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const testMail = 'an@available.mail';

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(userService.saveEntity).toHaveBeenCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
				expect(accountRepo.save).toHaveBeenCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
				expect(accountRepo.findByUsername).toHaveBeenCalledWith(testMail.toLowerCase());
				expect(accountRepo.findByUsername).toHaveBeenCalledTimes(1);
			});
		});

		describe('When email is already in use', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				accountRepo.findByUsername.mockResolvedValueOnce(accountDoFactory.build({ username: 'already@in.use' }));

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should throw ValidationError', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: 'already@in.use',
					})
				).rejects.toThrow(ValidationError);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('already@in.use');
			});
		});

		describe('When using teacher user', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockTeacherUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockTeacherAccountDo = accountDoFactory.build({
					userId: mockTeacherUser.id,
					password: defaultPasswordHash,
				});

				return { mockTeacherUser, mockTeacherAccountDo };
			};

			it('should allow to update first and last name', async () => {
				const { mockTeacherUser, mockTeacherAccountDo } = setup();

				await expect(
					accountService.updateMyAccount(mockTeacherUser, mockTeacherAccountDo, {
						passwordOld: defaultPassword,
						firstName: 'newFirstName',
					})
				).resolves.not.toThrow();
				await expect(
					accountService.updateMyAccount(mockTeacherUser, mockTeacherAccountDo, {
						passwordOld: defaultPassword,
						lastName: 'newLastName',
					})
				).resolves.not.toThrow();
			});
		});

		describe('When user can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockTeacherUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockTeacherAccountDo = accountDoFactory.build({
					userId: mockTeacherUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockRejectedValueOnce(undefined);

				return { mockTeacherUser, mockTeacherAccountDo };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockTeacherUser, mockTeacherAccountDo } = setup();

				await expect(
					accountService.updateMyAccount(mockTeacherUser, mockTeacherAccountDo, {
						passwordOld: defaultPassword,
						firstName: 'failToUpdate',
					})
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When account can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockResolvedValueOnce(undefined);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockRejectedValueOnce(undefined);
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: 'fail@to.update',
					})
				).rejects.toThrow(EntityNotFoundError);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('fail@to.update');
			});
		});

		describe('When save throws ValidationError', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockResolvedValueOnce(undefined);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockRejectedValueOnce(new ValidationError('fail to update'));
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should rethrow ValidationError', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();

				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: 'fail@to.update',
					})
				).rejects.toThrow(ValidationError);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('fail@to.update');
			});
		});
	});

	describe('updateAccount', () => {
		describe('When new password is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockResolvedValue();
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockImplementation((account: AccountSave): Promise<Account> => {
					Object.assign(mockStudentAccountDo, account);

					return Promise.resolve(mockStudentAccountDo);
				});

				return { mockStudentAccountDo, mockStudentUser };
			};

			it('should update target account password', async () => {
				const { mockStudentAccountDo, mockStudentUser } = setup();
				const previousPasswordHash = mockStudentAccountDo.password;
				const body = { password: defaultPassword } as UpdateAccount;

				expect(mockStudentUser.forcePasswordChange).toBeFalsy();
				await accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body);
				expect(mockStudentAccountDo.password).not.toBe(previousPasswordHash);
				expect(mockStudentUser.forcePasswordChange).toBeTruthy();
			});
		});

		describe('When username is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockResolvedValue();
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockImplementation((account: AccountSave): Promise<Account> => {
					Object.assign(mockStudentAccountDo, account);

					return Promise.resolve(mockStudentAccountDo);
				});
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should update target account username', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const newUsername = 'newUsername';
				const body = { username: newUsername } as UpdateAccount;

				expect(mockStudentAccountDo.username).not.toBe(newUsername);
				await accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body);
				expect(mockStudentAccountDo.username).toBe(newUsername.toLowerCase());
				expect(accountRepo.findByUsername).toHaveBeenCalledWith(newUsername.toLowerCase());
			});
		});

		describe('When activated flag is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockResolvedValue();
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockImplementation((account: AccountSave): Promise<Account> => {
					Object.assign(mockStudentAccountDo, account);

					return Promise.resolve(mockStudentAccountDo);
				});

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should update target account activation state', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const body = { activated: false } as UpdateAccount;

				await accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body);
				expect(mockStudentAccountDo.activated).toBeFalsy();
			});
		});

		describe('When account can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockResolvedValue();
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockRejectedValueOnce(undefined);
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const body = { username: 'fail@to.update' } as UpdateAccount;

				await expect(accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body)).rejects.toThrow(
					EntityNotFoundError
				);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('fail@to.update');
			});
		});

		describe('When user can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockRejectedValueOnce(undefined);
				accountRepo.findByUsername.mockResolvedValueOnce(null);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const body = { username: 'user-fail@to.update' } as UpdateAccount;

				await expect(accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body)).rejects.toThrow(
					EntityNotFoundError
				);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith('user-fail@to.update');
			});
		});

		describe('When Account is not updated', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should return target account', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const body = {} as UpdateAccount;
				const result = await accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body);

				expect(result).toBe(mockStudentAccountDo);
			});
		});

		describe('When new username already in use', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockOtherTeacherUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});

				const mockOtherTeacherAccount = accountFactory.buildWithId({
					userId: mockOtherTeacherUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.saveEntity.mockRejectedValueOnce(undefined);
				accountRepo.findByUsername.mockResolvedValueOnce(
					accountDoFactory.build({ username: mockOtherTeacherAccount.username })
				);

				return { mockStudentUser, mockStudentAccountDo, mockOtherTeacherAccount };
			};

			it('should throw ValidationError', async () => {
				const { mockStudentUser, mockStudentAccountDo, mockOtherTeacherAccount } = setup();
				const body = { username: mockOtherTeacherAccount.username } as UpdateAccount;

				await expect(accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body)).rejects.toThrow(
					ValidationError
				);
				expect(accountRepo.findByUsername).toHaveBeenCalledWith(mockOtherTeacherAccount.username);
			});
		});
	});

	describe('deactivateAccount', () => {
		describe('when deactivating account', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId();
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
					activated: true,
				});

				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);

				const mockStudentAccountDoSaved = accountDoFactory.build({
					userId: mockStudentUser.id,
				});
				accountRepo.save.mockResolvedValueOnce(mockStudentAccountDoSaved);

				return { mockStudentAccountDo, mockStudentUser };
			};

			it('should fetch account by userId', async () => {
				const { mockStudentUser } = setup();
				await accountService.deactivateAccount(mockStudentUser.id, new Date());

				expect(accountRepo.findByUserIdOrFail).toHaveBeenCalledWith(mockStudentUser.id);
			});

			it('should save account with deactivatedAt set', async () => {
				const { mockStudentUser } = setup();
				const deactivatedAt = new Date();
				await accountService.deactivateAccount(mockStudentUser.id, deactivatedAt);

				expect(accountRepo.save).toHaveBeenCalledWith(
					expect.objectContaining({
						deactivatedAt: deactivatedAt,
					})
				);
			});
		});
	});

	describe('reactivateAccount', () => {
		describe('when reactivating account', () => {
			const setup = () => {
				const mockStudentUser = userFactory.buildWithId();
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					deactivatedAt: new Date(),
				});

				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);

				const mockStudentAccountDoSaved = accountDoFactory.build({
					userId: mockStudentUser.id,
				});
				accountRepo.save.mockResolvedValueOnce(mockStudentAccountDoSaved);

				return { mockStudentAccountDo, mockStudentUser };
			};

			it('should fetch account by userId', async () => {
				const { mockStudentUser } = setup();
				await accountService.reactivateAccount(mockStudentUser.id);
				expect(accountRepo.findByUserIdOrFail).toHaveBeenCalledWith(mockStudentUser.id);
			});

			it('should save account with deactivatedAt undefined', async () => {
				const { mockStudentUser } = setup();
				await accountService.reactivateAccount(mockStudentUser.id);

				expect(accountRepo.save).toHaveBeenCalledWith(
					expect.not.objectContaining({
						deactivatedAt: expect.anything(),
					})
				);
			});
		});
	});

	describe('deactivateMultipleAccounts', () => {
		it('should call accountRepo.deactivateMultipleAccounts', async () => {
			const userIds = ['userId1', 'userId2'];
			const deactivatedAt = new Date();
			await accountService.deactivateMultipleAccounts(userIds, deactivatedAt);

			expect(accountRepo.deactivateMultipleByUserIds).toHaveBeenCalledWith(userIds, deactivatedAt);
		});
	});

	describe('replaceMyTemporaryPassword', () => {
		describe('When passwords do not match', () => {
			it('should throw ForbiddenOperationError', async () => {
				await expect(
					accountService.replaceMyTemporaryPassword('userId', defaultPassword, otherPassword)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When account does not exists', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();
				const mockUserWithoutAccount = userFactory.buildWithId({
					school: mockSchool,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockUserWithoutAccount);
				accountRepo.findByUserIdOrFail.mockImplementation(() => {
					throw new EntityNotFoundError('AccountEntity');
				});

				return { mockUserWithoutAccount };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockUserWithoutAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(mockUserWithoutAccount.id, defaultPassword, defaultPassword)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When user does not exist', () => {
			const setup = () => {
				userService.getUserEntityWithRoles.mockRejectedValueOnce(undefined);
			};

			it('should throw EntityNotFoundError', async () => {
				setup();

				await expect(
					accountService.replaceMyTemporaryPassword('accountWithoutUser', defaultPassword, defaultPassword)
				).rejects.toThrow(EntityNotFoundError);
			});
		});

		describe('When account is external', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockExternalUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const externalSystem = systemFactory.build();
				const mockExternalUserAccount = accountFactory.build({
					userId: mockExternalUser.id,
					password: defaultPasswordHash,
					systemId: externalSystem.id,
				});
				const mockExternalUserAccountDo = accountDoFactory.build({
					userId: mockExternalUser.id,
					password: defaultPasswordHash,
					systemId: externalSystem.id,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockExternalUser);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockExternalUserAccountDo);

				return { mockExternalUserAccount };
			};

			it('should throw ForbiddenOperationError', async () => {
				const { mockExternalUserAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockExternalUserAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When not the users password is temporary', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					forcePasswordChange: false,
					preferences: { firstLogin: true },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);

				return { mockStudentAccount };
			};

			it('should throw ForbiddenOperationError', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When old password is the same as new password', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);

				return { mockStudentAccount };
			};

			it('should throw ForbiddenOperationError', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(ForbiddenOperationError);
			});
		});

		describe('When old password is undefined', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: undefined,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);

				return { mockStudentAccount };
			};

			it('should throw Error', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						defaultPassword,
						defaultPassword
					)
				).rejects.toThrow(Error);
			});
		});

		describe('When the admin manipulate the users password', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					forcePasswordChange: true,
					preferences: { firstLogin: true },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValueOnce(mockStudentAccountDo);

				return { mockStudentAccount };
			};

			it('should allow to set strong password', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).resolves.not.toThrow();
			});
		});

		describe('when a user logs in for the first time', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValueOnce(mockStudentAccountDo);

				return { mockStudentAccount };
			};

			it('should allow to set strong password', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).resolves.not.toThrow();
			});
		});

		describe('when a user logs in for the first time (if undefined)', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					forcePasswordChange: false,
				});
				mockStudentUser.preferences = undefined;
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValueOnce(mockStudentAccountDo);

				return { mockStudentAccount };
			};

			it('should allow to set strong password', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).resolves.not.toThrow();
			});
		});

		describe('When user can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					firstName: 'failToUpdate',
					preferences: { firstLogin: false },
					forcePasswordChange: false,
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				userService.saveEntity.mockRejectedValueOnce(undefined);
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return { mockStudentAccount };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).rejects.toThrow(new EntityNotFoundError('User'));
			});
		});

		describe('When account can not be updated', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
					forcePasswordChange: false,
					preferences: { firstLogin: false },
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
					username: 'fail@to.update',
				});
				const mockStudentAccountDo = accountDoFactory.build({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				userService.getUserEntityWithRoles.mockResolvedValueOnce(mockStudentUser);
				userService.saveEntity.mockResolvedValueOnce();
				accountRepo.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountRepo.findById.mockResolvedValue(mockStudentAccountDo);
				accountRepo.save.mockRejectedValueOnce(undefined);

				return { mockStudentAccount };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockStudentAccount } = setup();

				await expect(
					accountService.replaceMyTemporaryPassword(
						mockStudentAccount.userId?.toString() ?? '',
						otherPassword,
						otherPassword
					)
				).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('findByUserIdsAndSystemId', () => {
		const setup = () => {
			const systemId = new ObjectId().toHexString();
			const userAId = new ObjectId().toHexString();
			const userBId = new ObjectId().toHexString();
			const userCId = new ObjectId().toHexString();

			const userIds = [userAId, userBId, userCId];
			const expectedResult = [userAId, userBId];

			accountRepo.findByUserIdsAndSystemId.mockResolvedValue(expectedResult);

			return { expectedResult, systemId, userIds };
		};

		it('should call accountRepo.findByUserIdsAndSystemId with userIds and systemId', async () => {
			const { systemId, userIds } = setup();

			await accountService.findByUserIdsAndSystemId(userIds, systemId);

			expect(accountRepo.findByUserIdsAndSystemId).toHaveBeenCalledWith(userIds, systemId);
		});

		it('should call deleteByUserId in accountService', async () => {
			const { expectedResult, systemId, userIds } = setup();

			const result = await accountService.findByUserIdsAndSystemId(userIds, systemId);

			expect(result).toEqual(expectedResult);
		});
	});

	describe('isUniqueEmail', () => {
		describe('when email is unique', () => {
			const setup = () => {
				const email = faker.internet.email();

				accountRepo.findByUsername.mockResolvedValue(null);

				return { email };
			};

			it('should return true', async () => {
				const { email } = setup();

				const result = await accountService.isUniqueEmail(email);

				expect(result).toBe(true);
			});
		});

		describe('when email is not unique', () => {
			const setup = () => {
				const email = faker.internet.email();
				const mockTeacherAccount = accountDoFactory.build();

				accountRepo.findByUsername.mockResolvedValue(mockTeacherAccount);

				return { email, mockTeacherAccount };
			};

			it('should return false', async () => {
				const { email } = setup();

				const result = await accountService.isUniqueEmail(email);

				expect(result).toBe(false);
			});
		});
	});
});
