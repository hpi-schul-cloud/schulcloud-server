import { Logger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory } from '@modules/school/testing';
import { systemFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import {
	AuthorizationError,
	EntityNotFoundError,
	ForbiddenOperationError,
	ValidationError,
} from '@shared/common/error';
import { setupEntities } from '@testing/database';
import 'reflect-metadata';
import { ACCOUNT_CONFIG_TOKEN, AccountConfig } from '../../account-config';
import { accountDoFactory, accountFactory } from '../../testing';
import { Account, AccountSave, UpdateAccount } from '../do';
import { IdmCallbackLoggableException } from '../error';
import { ACCOUNT_REPO, AccountRepo } from '../interface';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AccountService } from './account.service';
import { AbstractAccountService } from './account.service.abstract';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let accountServiceIdm: DeepMocked<AccountServiceIdm>;
	let accountServiceDb: DeepMocked<AccountServiceDb>;
	let config: AccountConfig;
	let logger: DeepMocked<Logger>;
	let userService: DeepMocked<UserService>;
	let accountRepo: DeepMocked<AccountRepo>;

	const newAccountService = () =>
		new AccountService(accountServiceDb, accountServiceIdm, config, logger, userService, accountRepo);

	const defaultPassword = 'DummyPasswd!1';
	const otherPassword = 'DummyPasswd!2';
	const defaultPasswordHash = '$2a$1$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities([User]);

		module = await Test.createTestingModule({
			providers: [
				AccountService,
				{
					provide: AccountServiceDb,
					useValue: createMock<AccountServiceDb>(),
				},
				{
					provide: AccountServiceIdm,
					useValue: createMock<AccountServiceIdm>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ACCOUNT_CONFIG_TOKEN,
					useValue: AccountConfig,
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
		accountServiceDb = module.get(AccountServiceDb);
		accountServiceIdm = module.get(AccountServiceIdm);
		accountService = module.get(AccountService);
		config = module.get(ACCOUNT_CONFIG_TOKEN);
		logger = module.get(Logger);
		userService = module.get(UserService);
		accountRepo = module.get(ACCOUNT_REPO);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
		jest.resetAllMocks();
		jest.resetModules();
	});

	describe('findById', () => {
		describe('When calling findById in accountService', () => {
			const setup = () => {
				accountServiceDb.findById.mockResolvedValueOnce(accountDoFactory.build());
			};

			it('should call findById in accountServiceDb', async () => {
				setup();

				await expect(accountService.findById('id')).resolves.not.toThrow();
				expect(accountServiceDb.findById).toHaveBeenCalledTimes(1);
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				accountServiceIdm.findById.mockResolvedValueOnce(accountDoFactory.build());

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findById('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.findById).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('findByUserId', () => {
		describe('When calling findByUserId in accountService', () => {
			const setup = () => {
				accountServiceDb.findByUserId.mockResolvedValueOnce(accountDoFactory.build());
			};

			it('should call findByUserId in accountServiceDb', async () => {
				setup();

				await expect(accountService.findByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceDb.findByUserId).toHaveBeenCalledTimes(1);
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				accountServiceIdm.findByUserId.mockResolvedValueOnce(accountDoFactory.build());

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.findByUserId).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('findByUsernameAndSystemId', () => {
		describe('When calling findByUsernameAndSystemId in accountService', () => {
			const setup = () => {
				accountServiceDb.findByUsernameAndSystemId.mockResolvedValueOnce(accountDoFactory.build());
			};

			it('should call findByUsernameAndSystemId in accountServiceDb', async () => {
				setup();

				await expect(accountService.findByUsernameAndSystemId('username', 'systemId')).resolves.not.toThrow();
				expect(accountServiceDb.findByUsernameAndSystemId).toHaveBeenCalledTimes(1);
			});
		});

		describe('when identity management is primary', () => {
			const setup = () => {
				accountServiceIdm.findByUsernameAndSystemId.mockResolvedValueOnce(accountDoFactory.build());

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findByUsernameAndSystemId('username', 'systemId')).resolves.not.toThrow();
				expect(accountServiceIdm.findByUsernameAndSystemId).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('findMultipleByUserId', () => {
		describe('When calling findMultipleByUserId in accountService', () => {
			const setup = () => {
				accountServiceDb.findMultipleByUserId.mockResolvedValueOnce([accountDoFactory.build()]);
			};

			it('should call findMultipleByUserId in accountServiceDb', async () => {
				setup();

				await expect(accountService.findMultipleByUserId(['userId1, userId2'])).resolves.not.toThrow();
				expect(accountServiceDb.findMultipleByUserId).toHaveBeenCalledTimes(1);
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				accountServiceIdm.findMultipleByUserId.mockResolvedValueOnce([accountDoFactory.build()]);

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findMultipleByUserId(['userId'])).resolves.not.toThrow();
				expect(accountServiceIdm.findMultipleByUserId).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('findByUserIdOrFail', () => {
		describe('When calling findByUserIdOrFail in accountService', () => {
			const setup = () => {
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(accountDoFactory.build());
			};

			it('should call findByUserIdOrFail in accountServiceDb', async () => {
				setup();

				await expect(accountService.findByUserIdOrFail('userId')).resolves.not.toThrow();
				expect(accountServiceDb.findByUserIdOrFail).toHaveBeenCalledTimes(1);
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				accountServiceIdm.findByUserIdOrFail.mockResolvedValueOnce(accountDoFactory.build());

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findByUserIdOrFail('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.findByUserIdOrFail).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('save', () => {
		describe('When calling save in accountService', () => {
			it('should call save in accountServiceDb', async () => {
				await expect(accountService.save({} as Account)).resolves.not.toThrow();
				expect(accountServiceDb.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling save in accountService if feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				const account = accountDoFactory.build();

				accountServiceDb.save.mockResolvedValueOnce(account);
				accountServiceIdm.save.mockResolvedValueOnce(account);

				return { service: newAccountService(), account };
			};

			it('should call save in accountServiceIdm', async () => {
				const { service, account } = setup();

				await expect(service.save(account)).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling save in accountService if feature is disabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = false;

				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should not call save in accountServiceIdm', async () => {
				const service = setup();

				await expect(service.save({} as Account)).resolves.not.toThrow();
				expect(accountServiceIdm.save).not.toHaveBeenCalled();
			});
		});

		describe('when identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				const account = accountDoFactory.build();

				accountServiceDb.save.mockResolvedValueOnce(account);
				accountServiceIdm.save.mockResolvedValueOnce(account);

				return { service: newAccountService(), account };
			};

			it('should call idm implementation', async () => {
				const { service, account } = setup();
				await expect(service.save(account)).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});

		describe(`when identity management is primary and can't update account`, () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				const account = accountDoFactory.build();

				accountServiceDb.save.mockResolvedValueOnce(account);
				accountServiceIdm.save.mockImplementation(() => Promise.reject(new Error()));

				return { service: newAccountService(), account };
			};

			it('should throw ValidationError', async () => {
				const { service, account } = setup();
				await expect(service.save(account)).rejects.toThrow(ValidationError);
			});
		});

		describe(`when identity management is primary and can't update username`, () => {
			const setup = () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = true;

				const account = accountDoFactory.build();

				accountServiceDb.save.mockResolvedValueOnce(account);
				accountServiceIdm.save.mockImplementation(() =>
					Promise.resolve(new Account({ username: 'otherUsername', id: '' }))
				);

				return { service: newAccountService(), account };
			};

			it('should throw ValidationError', async () => {
				const { service, account } = setup();
				await expect(service.save(account)).rejects.toThrow(ValidationError);
			});
		});
	});

	describe('saveAll', () => {
		describe('when saving accounts', () => {
			const setup = () => {
				const accounts = accountDoFactory.buildList(1);

				accountServiceDb.saveAll.mockResolvedValueOnce(accounts);
				accountServiceIdm.saveAll.mockResolvedValueOnce(accounts);

				return { accounts, sut: newAccountService() };
			};

			it('should delegate to db and idm service', async () => {
				const { accounts, sut } = setup();

				const result = await sut.saveAll(accounts);

				expect(result).toBeDefined();
				expect(accountServiceDb.saveAll).toHaveBeenCalledTimes(1);
				expect(accountServiceIdm.saveAll).toHaveBeenCalledTimes(1);
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
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
				const spy = jest.spyOn(accountService, 'save');

				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(true);

				return spy;
			};

			it('should not sanitize username for external user', async () => {
				const spy = setup();

				const params: AccountSave = {
					username: ' John.Doe@domain.tld ',
					systemId: new ObjectId().toHexString(),
				} as AccountSave;
				await accountService.saveWithValidation(params);
				expect(spy).toHaveBeenCalledWith(
					expect.objectContaining({
						username: ' John.Doe@domain.tld ',
					})
				);
				spy.mockRestore();
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
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(true);
			};

			it('should not throw an error', async () => {
				setup();
				const params: AccountSave = {
					username: 'John Doe',
					systemId: new ObjectId().toHexString(),
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
			});
		});

		describe('When username for an external user is a ldap search string', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(true);
			};

			it('should not throw an error', async () => {
				setup();
				const params: AccountSave = {
					username: 'dc=schul-cloud,dc=org/fake.ldap',
					systemId: new ObjectId().toHexString(),
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
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
				accountServiceDb.findByUserId.mockResolvedValueOnce({ id: 'foundAccount123' } as Account);
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Account already exists');
			});
		});

		describe('When username already exists in mongoDB', () => {
			const setup = () => {
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(false);
			};

			it('should throw username already exists', async () => {
				setup();
				const params: AccountSave = {
					username: 'john.doe@mail.tld',
					password: 'JohnsPassword_123',
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username already exists');
			});
		});

		describe('When username already exists in identity management', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				accountServiceIdm.isUniqueEmail.mockResolvedValueOnce(false);
			};

			it('should throw username already exists', async () => {
				setup();
				const params: AccountSave = {
					username: 'john.doe@mail.tld',
					password: 'JohnsPassword_123',
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username already exists');
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				const account = accountDoFactory.build({
					password: defaultPasswordHash,
					username: 'username@mail.tld',
				});

				accountServiceDb.save.mockResolvedValueOnce(account);
				accountServiceIdm.save.mockResolvedValueOnce(account);

				accountServiceIdm.isUniqueEmail.mockResolvedValueOnce(true);

				return { service: newAccountService(), account };
			};

			it('should call idm implementation', async () => {
				const { service, account } = setup();
				await expect(service.saveWithValidation(account)).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('updateUsername', () => {
		describe('When calling updateUsername in accountService', () => {
			it('should call updateUsername in accountServiceDb', async () => {
				await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
				expect(accountServiceDb.updateUsername).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling updateUsername in accountService if idm feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				accountServiceDb.updateUsername.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should call updateUsername in accountServiceIdm', async () => {
				const service = setup();

				await expect(service.updateUsername('accountId', 'username')).resolves.not.toThrow();
				expect(accountServiceIdm.updateUsername).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling updateUsername in accountService if idm feature is disabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;

				accountServiceDb.updateUsername.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should not call updateUsername in accountServiceIdm', async () => {
				const service = setup();

				await expect(service.updateUsername('accountId', 'username')).resolves.not.toThrow();
				expect(accountServiceIdm.updateUsername).not.toHaveBeenCalled();
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				accountServiceDb.updateUsername.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.updateUsername('accountId', 'username')).resolves.not.toThrow();
				expect(accountServiceIdm.updateUsername).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('updateLastLogin', () => {
		it('should call updateLastLogin in accountServiceDb', async () => {
			const someId = new ObjectId().toHexString();

			await accountService.updateLastLogin(someId, new Date());

			expect(accountServiceDb.updateLastLogin).toHaveBeenCalledTimes(1);
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		describe('When calling updateLastTriedFailedLogin in accountService', () => {
			it('should call updateLastTriedFailedLogin in accountServiceDb', async () => {
				await expect(accountService.updateLastTriedFailedLogin('accountId', {} as Date)).resolves.not.toThrow();
				expect(accountServiceDb.updateLastTriedFailedLogin).toHaveBeenCalledTimes(1);
			});
		});

		describe('when identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				accountServiceDb.updateLastTriedFailedLogin.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.updateLastTriedFailedLogin('accountId', new Date())).resolves.not.toThrow();
				expect(accountServiceIdm.updateLastTriedFailedLogin).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('updatePassword', () => {
		describe('When calling updatePassword in accountService', () => {
			it('should call updatePassword in accountServiceDb', async () => {
				await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
				expect(accountServiceDb.updatePassword).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling updatePassword in accountService if feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				accountServiceDb.updatePassword.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should call updatePassword in accountServiceIdm', async () => {
				const service = setup();

				await expect(service.updatePassword('accountId', 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.updatePassword).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling updatePassword in accountService if feature is disabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;

				accountServiceDb.updatePassword.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should not call updatePassword in accountServiceIdm', async () => {
				const service = setup();

				await expect(service.updatePassword('accountId', 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.updatePassword).not.toHaveBeenCalled();
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;

				accountServiceDb.updatePassword.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.updatePassword('accountId', 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.updatePassword).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('validatePassword', () => {
		describe('when validating a password', () => {
			const setup = () => {
				accountServiceDb.validatePassword.mockResolvedValueOnce(true);
			};

			it('should call validatePassword in accountServiceDb', async () => {
				setup();

				await expect(accountService.validatePassword({} as Account, 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.validatePassword).toHaveBeenCalledTimes(0);
				expect(accountServiceDb.validatePassword).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling validatePassword in accountService if feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;
				accountServiceIdm.validatePassword.mockResolvedValueOnce(true);

				return newAccountService();
			};

			it('should call validatePassword in accountServiceIdm', async () => {
				const service = setup();
				await expect(service.validatePassword({} as Account, 'password')).resolves.not.toThrow();
				expect(accountServiceDb.validatePassword).toHaveBeenCalledTimes(0);
				expect(accountServiceIdm.validatePassword).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('delete', () => {
		describe('When calling delete in accountService', () => {
			it('should call delete in accountServiceDb', async () => {
				await expect(accountService.delete('accountId')).resolves.not.toThrow();
				expect(accountServiceDb.delete).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling delete in accountService if feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;
			};

			it('should call delete in accountServiceIdm', async () => {
				setup();

				await expect(accountService.delete('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.delete).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling delete in accountService if feature is disabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
			};

			it('should not call delete in accountServiceIdm', async () => {
				setup();

				await expect(accountService.delete('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.delete).not.toHaveBeenCalled();
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;
				return newAccountService();
			};

			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.delete('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.delete).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('When calling deleteByUserId in accountService', () => {
			it('should call deleteByUserId in accountServiceDb', async () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceDb.deleteByUserId).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling deleteByUserId in accountService if feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;
				accountServiceDb.deleteByUserId.mockResolvedValueOnce(['accountId']);
				accountServiceIdm.deleteByUserId.mockResolvedValueOnce(['accountId']);
			};

			it('should call deleteByUserId in accountServiceIdm', async () => {
				setup();

				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.deleteByUserId).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling deleteByUserId in accountService if feature is disabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
			};

			it('should not call deleteByUserId in accountServiceIdm', async () => {
				setup();

				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.deleteByUserId).not.toHaveBeenCalled();
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				config.identityManagementStoreEnabled = true;
				return newAccountService();
			};

			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.deleteByUserId).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('findMany', () => {
		describe('When calling findMany in accountService', () => {
			const setup = () => {
				accountServiceDb.findMany.mockResolvedValueOnce(accountDoFactory.buildList(1));
			};

			it('should call findMany in accountServiceDb', async () => {
				setup();

				await expect(accountService.findMany()).resolves.not.toThrow();
				expect(accountServiceDb.findMany).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('searchByUsernamePartialMatch', () => {
		describe('When calling searchByUsernamePartialMatch in accountService', () => {
			const setup = () => {
				accountServiceDb.searchByUsernamePartialMatch.mockResolvedValueOnce([accountDoFactory.buildList(1), 1]);
			};

			it('should call searchByUsernamePartialMatch in accountServiceDb', async () => {
				setup();

				await expect(accountService.searchByUsernamePartialMatch('username', 1, 1)).resolves.not.toThrow();
				expect(accountServiceDb.searchByUsernamePartialMatch).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('searchByUsernameExactMatch', () => {
		const setup = () => {
			accountServiceDb.searchByUsernameExactMatch.mockResolvedValueOnce([accountDoFactory.buildList(1), 1]);
		};

		it('should call searchByUsernameExactMatch in accountServiceDb', async () => {
			setup();

			await expect(accountService.searchByUsernameExactMatch('username')).resolves.not.toThrow();
			expect(accountServiceDb.searchByUsernameExactMatch).toHaveBeenCalledTimes(1);
		});
	});

	describe('when identity management is primary', () => {
		describe('findById', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				accountServiceIdm.findById.mockResolvedValueOnce(accountDoFactory.build());

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findById('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.findById).toHaveBeenCalledTimes(1);
			});
		});

		describe('searchByUsernamePartialMatch', () => {
			const setup = () => {
				config.identityManagementStoreEnabled = true;
				accountServiceIdm.searchByUsernamePartialMatch.mockResolvedValueOnce([accountDoFactory.buildList(1), 1]);

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.searchByUsernamePartialMatch('username', 0, 1)).resolves.not.toThrow();
				expect(accountServiceIdm.searchByUsernamePartialMatch).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('searchByUsernameExactMatch', () => {
		describe('When calling searchByUsernameExactMatch in accountService', () => {
			const setup = () => {
				accountServiceDb.searchByUsernameExactMatch.mockResolvedValueOnce([accountDoFactory.buildList(1), 1]);
			};

			it('should call searchByUsernameExactMatch in accountServiceDb', async () => {
				setup();

				await expect(accountService.searchByUsernameExactMatch('username')).resolves.not.toThrow();
				expect(accountServiceDb.searchByUsernameExactMatch).toHaveBeenCalledTimes(1);
			});
		});

		describe('when identity management is primary', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				accountServiceIdm.searchByUsernameExactMatch.mockResolvedValueOnce([accountDoFactory.buildList(1), 1]);

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.searchByUsernameExactMatch('username')).resolves.not.toThrow();
				expect(accountServiceIdm.searchByUsernameExactMatch).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('executeIdmMethod', () => {
		describe('When idm feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				const testError = new Error('error');
				accountServiceIdm.deleteByUserId.mockImplementationOnce(() => {
					throw testError;
				});

				const spyLogger = jest.spyOn(logger, 'debug');

				return { testError, spyLogger };
			};

			it('should call executeIdmMethod and throw an error object', async () => {
				const { testError, spyLogger } = setup();

				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(spyLogger).toHaveBeenCalledWith(new IdmCallbackLoggableException(testError));
			});
		});

		describe('When idm feature is enabled', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = true;
				const spyLogger = jest.spyOn(logger, 'debug');
				const deleteByUserIdMock = jest.spyOn(accountServiceIdm, 'deleteByUserId');
				deleteByUserIdMock.mockImplementationOnce(() => {
					// eslint-disable-next-line @typescript-eslint/no-throw-literal
					throw 'a non error object';
				});
				return { spyLogger };
			};

			it('should call executeIdmMethod and throw a non error object', async () => {
				const { spyLogger } = setup();

				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(spyLogger).toHaveBeenCalledWith(new IdmCallbackLoggableException('a non error object'));
			});
		});
	});

	describe('updateMyAccount', () => {
		describe('When account is external', () => {
			const setup = () => {
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
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

				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockExternalAccount);

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

				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccount);
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);

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

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);

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

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				const spyAccountServiceSave = jest.spyOn(accountServiceDb, 'save');

				accountServiceDb.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentUser, mockStudentAccountDo, spyAccountServiceSave };
			};

			it('should not update password', async () => {
				const { mockStudentUser, mockStudentAccountDo, spyAccountServiceSave } = setup();
				await accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
					passwordOld: defaultPassword,
					passwordNew: undefined,
					email: 'newemail@to.update',
				});
				expect(spyAccountServiceSave).toHaveBeenCalledWith(
					expect.objectContaining({
						password: undefined,
					})
				);
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

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				accountServiceDb.isUniqueEmail.mockResolvedValue(true);

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

				accountServiceDb.validatePassword.mockResolvedValue(true);

				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				const accountSaveSpy = jest.spyOn(accountServiceDb, 'save');

				return { mockStudentUser, mockStudentAccountDo, accountSaveSpy };
			};

			it('should use email as account user name in lower case', async () => {
				const { mockStudentUser, mockStudentAccountDo, accountSaveSpy } = setup();

				const testMail = 'AN@AVAILABLE.MAIL';
				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(accountSaveSpy).toBeCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
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

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(true);

				const userUpdateSpy = jest.spyOn(userService, 'saveEntity');

				return { mockStudentUser, mockStudentAccountDo, userUpdateSpy };
			};

			it('should use email as user email in lower case', async () => {
				const { mockStudentUser, mockStudentAccountDo, userUpdateSpy } = setup();
				const testMail = 'AN@AVAILABLE.MAIL';
				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(userUpdateSpy).toBeCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
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

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(true);

				const accountSaveSpy = jest.spyOn(accountServiceDb, 'save');
				const userUpdateSpy = jest.spyOn(userService, 'saveEntity');

				return { mockStudentUser, mockStudentAccountDo, accountSaveSpy, userUpdateSpy };
			};

			it('should always update account user name AND user email together.', async () => {
				const { mockStudentUser, mockStudentAccountDo, accountSaveSpy, userUpdateSpy } = setup();
				const testMail = 'an@available.mail';
				await expect(
					accountService.updateMyAccount(mockStudentUser, mockStudentAccountDo, {
						passwordOld: defaultPassword,
						email: testMail,
					})
				).resolves.not.toThrow();
				expect(userUpdateSpy).toBeCalledWith(expect.objectContaining({ email: testMail.toLowerCase() }));
				expect(accountSaveSpy).toBeCalledWith(expect.objectContaining({ username: testMail.toLowerCase() }));
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

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(false);

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

				accountServiceDb.validatePassword.mockResolvedValue(true);

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
				accountServiceDb.validatePassword.mockResolvedValue(true);

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
				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockRejectedValueOnce(undefined);

				accountServiceDb.isUniqueEmail.mockResolvedValue(true);

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
				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockRejectedValueOnce(new ValidationError('fail to update'));

				accountServiceDb.isUniqueEmail.mockResolvedValue(true);

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
				accountServiceDb.save.mockImplementation((account: AccountSave): Promise<Account> => {
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
				accountServiceDb.save.mockImplementation((account: AccountSave): Promise<Account> => {
					Object.assign(mockStudentAccountDo, account);

					return Promise.resolve(mockStudentAccountDo);
				});
				accountServiceDb.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should update target account username', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const newUsername = 'newUsername';
				const body = { username: newUsername } as UpdateAccount;

				expect(mockStudentAccountDo.username).not.toBe(newUsername);
				await accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body);
				expect(mockStudentAccountDo.username).toBe(newUsername.toLowerCase());
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
				accountServiceDb.save.mockImplementation((account: AccountSave): Promise<Account> => {
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
				accountServiceDb.save.mockRejectedValueOnce(undefined);

				accountServiceDb.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const body = { username: 'fail@to.update' } as UpdateAccount;

				await expect(accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body)).rejects.toThrow(
					EntityNotFoundError
				);
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

				accountServiceDb.isUniqueEmail.mockResolvedValue(true);

				return { mockStudentUser, mockStudentAccountDo };
			};

			it('should throw EntityNotFoundError', async () => {
				const { mockStudentUser, mockStudentAccountDo } = setup();
				const body = { username: 'user-fail@to.update' } as UpdateAccount;

				await expect(accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body)).rejects.toThrow(
					EntityNotFoundError
				);
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
				accountServiceDb.isUniqueEmail.mockResolvedValueOnce(false);

				return { mockStudentUser, mockStudentAccountDo, mockOtherTeacherAccount };
			};

			it('should throw ValidationError', async () => {
				const { mockStudentUser, mockStudentAccountDo, mockOtherTeacherAccount } = setup();
				const body = { username: mockOtherTeacherAccount.username } as UpdateAccount;

				await expect(accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body)).rejects.toThrow(
					ValidationError
				);
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

				const mockStudentAccountDoSaved = accountDoFactory.build({
					userId: mockStudentUser.id,
				});
				accountServiceDb.save.mockResolvedValueOnce(mockStudentAccountDoSaved);

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
				expect(accountServiceDb.save).toHaveBeenCalledWith(
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

				const mockStudentAccountDoSaved = accountDoFactory.build({
					userId: mockStudentUser.id,
				});
				accountServiceDb.save.mockResolvedValueOnce(mockStudentAccountDoSaved);

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
				expect(accountServiceDb.save).toHaveBeenCalledWith(
					expect.not.objectContaining({
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
				accountServiceDb.findByUserIdOrFail.mockImplementation(() => {
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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockExternalUserAccountDo);

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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);

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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountServiceDb.validatePassword.mockResolvedValueOnce(true);

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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountServiceDb.validatePassword.mockResolvedValueOnce(true);

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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);
				accountServiceDb.save.mockResolvedValueOnce(mockStudentAccountDo);

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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);
				accountServiceDb.save.mockResolvedValueOnce(mockStudentAccountDo);

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
				config.identityManagementLoginEnabled = false;
				config.identityManagementStoreEnabled = false;
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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);
				accountServiceDb.save.mockResolvedValueOnce(mockStudentAccountDo);

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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);
				accountServiceDb.save.mockResolvedValueOnce({
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
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(mockStudentAccountDo);
				accountServiceDb.save.mockRejectedValueOnce(undefined);
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);

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
		describe('when checking if email is unique', () => {
			const setup = () => {
				const email = faker.internet.email();
				const accountImpl = Reflect.get(accountService, 'accountImpl') as DeepMocked<AbstractAccountService>;
				const isUniqueEmailSpy = jest.spyOn(accountImpl, 'isUniqueEmail');

				return { email, isUniqueEmailSpy };
			};

			it('should call the underlying account service implementation', async () => {
				const { email, isUniqueEmailSpy } = setup();

				await accountService.isUniqueEmail(email);

				expect(isUniqueEmailSpy).toHaveBeenCalledWith(email);
			});
		});
	});
});
