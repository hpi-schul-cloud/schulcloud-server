import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizationError, EntityNotFoundError, ForbiddenOperationError, ValidationError } from '@shared/common';
import { User } from '@shared/domain/entity';
import { UserRepo } from '@shared/repo';
import { accountFactory, schoolEntityFactory, setupEntities, systemFactory, userFactory } from '@shared/testing';
import 'reflect-metadata';
import { EventBus } from '@nestjs/cqrs';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	DataDeletedEvent,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { Logger } from '../../../core/logger';
import { AccountConfig } from '../account-config';
import { Account, AccountSave, UpdateAccount } from '../domain';
import { AccountEntity } from '../entity/account.entity';
import { AccountEntityToDoMapper } from '../repo/mapper';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AccountService } from './account.service';
import { AccountValidationService } from './account.validation.service';
import { IdmCallbackLoggableException } from '../loggable';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let accountServiceIdm: DeepMocked<AccountServiceIdm>;
	let accountServiceDb: DeepMocked<AccountServiceDb>;
	let accountValidationService: DeepMocked<AccountValidationService>;
	let configService: DeepMocked<ConfigService>;
	let logger: DeepMocked<Logger>;
	let userRepo: DeepMocked<UserRepo>;
	let eventBus: DeepMocked<EventBus>;

	const newAccountService = () =>
		new AccountService(
			accountServiceDb,
			accountServiceIdm,
			configService,
			accountValidationService,
			logger,
			userRepo,
			eventBus
		);

	const defaultPassword = 'DummyPasswd!1';
	const otherPassword = 'DummyPasswd!2';
	const defaultPasswordHash = '$2a$1$/DsztV5o6P5piW2eWJsxw.4nHovmJGBA.QNwiTmuZ/uvUc40b.Uhu';

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
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
					provide: ConfigService,
					useValue: createMock<ConfigService<AccountConfig, true>>(),
				},
				{
					provide: AccountValidationService,
					useValue: {
						isUniqueEmail: jest.fn().mockResolvedValue(true),
					},
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
			],
		}).compile();
		accountServiceDb = module.get(AccountServiceDb);
		accountServiceIdm = module.get(AccountServiceIdm);
		accountService = module.get(AccountService);
		accountValidationService = module.get(AccountValidationService);
		configService = module.get(ConfigService);
		logger = module.get(Logger);
		userRepo = module.get(UserRepo);
		eventBus = module.get(EventBus);

		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
		jest.resetAllMocks();
		jest.resetModules();
	});

	describe('findById', () => {
		describe('When calling findById in accountService', () => {
			it('should call findById in accountServiceDb', async () => {
				await expect(accountService.findById('id')).resolves.not.toThrow();
				expect(accountServiceDb.findById).toHaveBeenCalledTimes(1);
			});
		});

		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
			it('should call findByUserId in accountServiceDb', async () => {
				await expect(accountService.findByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceDb.findByUserId).toHaveBeenCalledTimes(1);
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
			it('should call findByUsernameAndSystemId in accountServiceDb', async () => {
				await expect(accountService.findByUsernameAndSystemId('username', 'systemId')).resolves.not.toThrow();
				expect(accountServiceDb.findByUsernameAndSystemId).toHaveBeenCalledTimes(1);
			});
		});
		describe('when identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
			it('should call findMultipleByUserId in accountServiceDb', async () => {
				await expect(accountService.findMultipleByUserId(['userId1, userId2'])).resolves.not.toThrow();
				expect(accountServiceDb.findMultipleByUserId).toHaveBeenCalledTimes(1);
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
			it('should call findByUserIdOrFail in accountServiceDb', async () => {
				await expect(accountService.findByUserIdOrFail('userId')).resolves.not.toThrow();
				expect(accountServiceDb.findByUserIdOrFail).toHaveBeenCalledTimes(1);
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
				configService.get.mockReturnValue(true);

				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};
			it('should call save in accountServiceIdm', async () => {
				const service = setup();

				await expect(service.save({} as Account)).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});
		describe('When calling save in accountService if feature is disabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(false);

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
				configService.get.mockReturnValue(true);
				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);

				return newAccountService();
			};
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.save({ username: 'username' } as AccountSave)).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('saveWithValidation', () => {
		describe('When calling saveWithValidation on accountService', () => {
			const setup = () => {
				const spy = jest.spyOn(accountService, 'save');

				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);

				return spy;
			};
			it('should not sanitize username for external user', async () => {
				const spy = setup();

				const params: AccountSave = {
					username: ' John.Doe@domain.tld ',
					systemId: 'ABC123',
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
					password: 'JohnsPassword',
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username is not an email');
			});
		});

		describe('When username for an external user is not an email', () => {
			const setup = () => {
				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);
			};

			it('should not throw an error', async () => {
				setup();
				const params: AccountSave = {
					username: 'John Doe',
					systemId: 'ABC123',
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
			});
		});

		describe('When username for an external user is a ldap search string', () => {
			const setup = () => {
				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);
			};

			it('should not throw an error', async () => {
				setup();
				const params: AccountSave = {
					username: 'dc=schul-cloud,dc=org/fake.ldap',
					systemId: 'ABC123',
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
					password: 'JohnsPassword',
					userId: 'userId123',
				} as AccountSave;
				accountServiceDb.findByUserId.mockResolvedValueOnce({ id: 'foundAccount123' } as Account);
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Account already exists');
			});
		});

		describe('When username already exists', () => {
			const setup = () => {
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(false);
			};
			it('should throw username already exists', async () => {
				setup();
				const params: AccountSave = {
					username: 'john.doe@mail.tld',
					password: 'JohnsPassword',
				} as AccountSave;
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username already exists');
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
				accountServiceDb.save.mockResolvedValueOnce({
					getProps: () => {
						return { id: '' };
					},
				} as Account);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);

				return newAccountService();
			};

			it('should call idm implementation', async () => {
				const service = setup();
				await expect(
					service.saveWithValidation({ username: 'username@mail.tld', password: 'password' } as AccountSave)
				).resolves.not.toThrow();
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
				configService.get.mockReturnValue(true);

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
				configService.get.mockReturnValue(false);

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
				configService.get.mockReturnValue(true);

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

	describe('updateLastTriedFailedLogin', () => {
		describe('When calling updateLastTriedFailedLogin in accountService', () => {
			it('should call updateLastTriedFailedLogin in accountServiceDb', async () => {
				await expect(accountService.updateLastTriedFailedLogin('accountId', {} as Date)).resolves.not.toThrow();
				expect(accountServiceDb.updateLastTriedFailedLogin).toHaveBeenCalledTimes(1);
			});
		});
		describe('when identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);

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
				configService.get.mockReturnValue(true);

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
				configService.get.mockReturnValue(false);

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
				configService.get.mockReturnValue(true);

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
		describe('When calling validatePassword in accountService', () => {
			it('should call validatePassword in accountServiceDb', async () => {
				await expect(accountService.validatePassword({} as Account, 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.validatePassword).toHaveBeenCalledTimes(0);
				expect(accountServiceDb.validatePassword).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling validatePassword in accountService if feature is enabled', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
				configService.get.mockReturnValueOnce(true);
			};
			it('should call delete in accountServiceIdm', async () => {
				setup();

				await expect(accountService.delete('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.delete).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling delete in accountService if feature is disabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(false);
			};
			it('should not call delete in accountServiceIdm', async () => {
				setup();

				await expect(accountService.delete('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.delete).not.toHaveBeenCalled();
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceDb.deleteByUserId).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling deleteByUserId in accountService if feature is enabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(true);
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
				configService.get.mockReturnValueOnce(false);
			};
			it('should not call deleteByUserId in accountServiceIdm', async () => {
				setup();

				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.deleteByUserId).not.toHaveBeenCalled();
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
				return newAccountService();
			};

			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.deleteByUserId).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('deleteAccountByUserId', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const accountId = new ObjectId().toHexString();
			const spy = jest.spyOn(accountService, 'deleteByUserId');

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.ACCOUNT, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 1, [accountId]),
			]);

			return { accountId, expectedResult, spy, userId };
		};

		it('should call deleteByUserId in accountService', async () => {
			const { spy, userId } = setup();

			spy.mockResolvedValueOnce([]);

			await accountService.deleteUserData(userId);
			expect(spy).toHaveBeenCalledWith(userId);
			spy.mockRestore();
		});

		it('should call deleteByUserId in accountService', async () => {
			const { accountId, expectedResult, spy, userId } = setup();

			spy.mockResolvedValueOnce([accountId]);

			const result = await accountService.deleteUserData(userId);
			expect(spy).toHaveBeenCalledWith(userId);
			expect(result).toEqual(expectedResult);
			spy.mockRestore();
		});
	});

	describe('findMany', () => {
		describe('When calling findMany in accountService', () => {
			it('should call findMany in accountServiceDb', async () => {
				await expect(accountService.findMany()).resolves.not.toThrow();
				expect(accountServiceDb.findMany).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('searchByUsernamePartialMatch', () => {
		describe('When calling searchByUsernamePartialMatch in accountService', () => {
			it('should call searchByUsernamePartialMatch in accountServiceDb', async () => {
				await expect(accountService.searchByUsernamePartialMatch('username', 1, 1)).resolves.not.toThrow();
				expect(accountServiceDb.searchByUsernamePartialMatch).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('searchByUsernameExactMatch', () => {
		it('should call searchByUsernameExactMatch in accountServiceDb', async () => {
			await expect(accountService.searchByUsernameExactMatch('username')).resolves.not.toThrow();
			expect(accountServiceDb.searchByUsernameExactMatch).toHaveBeenCalledTimes(1);
		});
	});

	describe('when identity management is primary', () => {
		describe('findById', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
				configService.get.mockReturnValue(true);
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
			it('should call searchByUsernameExactMatch in accountServiceDb', async () => {
				await expect(accountService.searchByUsernameExactMatch('username')).resolves.not.toThrow();
				expect(accountServiceDb.searchByUsernameExactMatch).toHaveBeenCalledTimes(1);
			});
		});
		describe('when identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
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
				configService.get.mockReturnValueOnce(true);
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
				configService.get.mockReturnValueOnce(true);
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

				const mockExternalAccount: Account = AccountEntityToDoMapper.mapToDo(mockExternalUserAccount);

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
				const mockStudentAccountEntity = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccount: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccountEntity);

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

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

				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				const spyAccountServiceSave = jest.spyOn(accountServiceDb, 'save');

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				accountValidationService.isUniqueEmail.mockResolvedValue(true);

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				accountServiceDb.validatePassword.mockResolvedValue(true);

				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);
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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});

				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);

				const userUpdateSpy = jest.spyOn(userRepo, 'save');

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockResolvedValue(mockStudentAccountDo);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(true);

				const accountSaveSpy = jest.spyOn(accountServiceDb, 'save');
				const userUpdateSpy = jest.spyOn(userRepo, 'save');

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(false);

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

				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPasswordHash,
				});
				const mockTeacherAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockTeacherAccount);

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
				const mockTeacherAccount = accountFactory.buildWithId({
					userId: mockTeacherUser.id,
					password: defaultPasswordHash,
				});

				const mockTeacherAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockTeacherAccount);

				userRepo.save.mockRejectedValueOnce(undefined);
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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				userRepo.save.mockResolvedValueOnce(undefined);
				accountServiceDb.validatePassword.mockResolvedValue(true);
				accountServiceDb.save.mockRejectedValueOnce(undefined);

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

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
	});

	describe('updateAccount', () => {
		describe('When new password is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();
				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				userRepo.save.mockResolvedValue();
				accountServiceDb.save.mockImplementation((account: AccountSave): Promise<Account> => {
					Object.assign(mockStudentAccount, account.getProps());
					return Promise.resolve(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
				});

				return { mockStudentAccount, mockStudentAccountDo, mockStudentUser };
			};
			it('should update target account password', async () => {
				const { mockStudentAccount, mockStudentAccountDo, mockStudentUser } = setup();
				const previousPasswordHash = mockStudentAccount.password;
				const body = { password: defaultPassword } as UpdateAccount;

				expect(mockStudentUser.forcePasswordChange).toBeFalsy();
				await accountService.updateAccount(mockStudentUser, mockStudentAccountDo, body);
				expect(mockStudentAccount.password).not.toBe(previousPasswordHash);
				expect(mockStudentUser.forcePasswordChange).toBeTruthy();
			});
		});

		describe('When username is given', () => {
			const setup = () => {
				const mockSchool = schoolEntityFactory.buildWithId();

				const mockStudentUser = userFactory.buildWithId({
					school: mockSchool,
				});
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				userRepo.save.mockResolvedValue();
				accountServiceDb.save.mockImplementation((account: AccountSave): Promise<Account> => {
					Object.assign(mockStudentAccount, account.getProps());
					return Promise.resolve(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
				});
				accountValidationService.isUniqueEmail.mockResolvedValue(true);

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				userRepo.save.mockResolvedValue();
				accountServiceDb.save.mockImplementation((account: AccountSave): Promise<Account> => {
					Object.assign(mockStudentAccount, account);
					return Promise.resolve(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				userRepo.save.mockResolvedValue();
				accountServiceDb.save.mockRejectedValueOnce(undefined);

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				userRepo.save.mockRejectedValueOnce(undefined);

				accountValidationService.isUniqueEmail.mockResolvedValue(true);

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
				const mockStudentAccount = accountFactory.buildWithId({
					userId: mockStudentUser.id,
					password: defaultPasswordHash,
				});
				const mockStudentAccountDo: Account = AccountEntityToDoMapper.mapToDo(mockStudentAccount);

				userRepo.save.mockRejectedValueOnce(undefined);
				accountValidationService.isUniqueEmail.mockResolvedValueOnce(false);

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

				userRepo.findById.mockResolvedValueOnce(mockUserWithoutAccount);
				accountServiceDb.findByUserIdOrFail.mockImplementation(() => {
					throw new EntityNotFoundError(AccountEntity.name);
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
				userRepo.findById.mockRejectedValueOnce(undefined);
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

				userRepo.findById.mockResolvedValueOnce(mockExternalUser);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(
					AccountEntityToDoMapper.mapToDo(mockExternalUserAccount)
				);

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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));

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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);
				accountServiceDb.save.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));

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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);
				accountServiceDb.save.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));

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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
				accountServiceDb.validatePassword.mockResolvedValueOnce(false);
				accountServiceDb.save.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));

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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				userRepo.save.mockRejectedValueOnce(undefined);
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
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
				).rejects.toThrow(new EntityNotFoundError(User.name));
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

				userRepo.findById.mockResolvedValueOnce(mockStudentUser);
				userRepo.save.mockResolvedValueOnce();
				accountServiceDb.findByUserIdOrFail.mockResolvedValueOnce(AccountEntityToDoMapper.mapToDo(mockStudentAccount));
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

	describe('deleteUserData', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const accountId = new ObjectId().toHexString();

			const expectedData = DomainDeletionReportBuilder.build(DomainName.ACCOUNT, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 1, [accountId]),
			]);

			return {
				accountId,
				expectedData,
				userId,
			};
		};

		describe('when deleteUserData', () => {
			it('should call deleteByUserId in accountService', async () => {
				const { accountId, userId } = setup();
				jest.spyOn(accountService, 'deleteByUserId').mockResolvedValueOnce([accountId]);

				await accountService.deleteUserData(userId);

				expect(accountService.deleteByUserId).toHaveBeenCalledWith(userId);
			});

			it('should call deleteByUserId in accountService', async () => {
				const { accountId, expectedData, userId } = setup();
				jest.spyOn(accountService, 'deleteByUserId').mockResolvedValueOnce([accountId]);

				const result = await accountService.deleteUserData(userId);

				expect(result).toEqual(expectedData);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.ACCOUNT;
			const accountId = new ObjectId().toHexString();
			const deletionRequest = deletionRequestFactory.buildWithId({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.ACCOUNT, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 1, [accountId]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in accountService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(accountService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await accountService.handle({ deletionRequestId, targetRefId });

				expect(accountService.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(accountService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await accountService.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
