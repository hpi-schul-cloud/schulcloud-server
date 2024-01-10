import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ServerConfig } from '@modules/server';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '../../../core/logger';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AccountService } from './account.service';
import { AccountValidationService } from './account.validation.service';
import { Account } from '../domain';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let accountServiceIdm: DeepMocked<AccountServiceIdm>;
	let accountServiceDb: DeepMocked<AccountServiceDb>;
	let accountValidationService: DeepMocked<AccountValidationService>;
	let configService: DeepMocked<ConfigService>;
	let logger: DeepMocked<LegacyLogger>;

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
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService<ServerConfig, true>>(),
				},
				{
					provide: AccountValidationService,
					useValue: {
						isUniqueEmail: jest.fn().mockResolvedValue(true),
					},
				},
			],
		}).compile();
		accountServiceDb = module.get(AccountServiceDb);
		accountServiceIdm = module.get(AccountServiceIdm);
		accountService = module.get(AccountService);
		accountValidationService = module.get(AccountValidationService);
		configService = module.get(ConfigService);
		logger = module.get(LegacyLogger);
	});

	beforeEach(() => {
		jest.clearAllMocks();
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				configService.get.mockReturnValueOnce(true);
			};
			it('should call save in accountServiceIdm', async () => {
				setup();

				await expect(accountService.save({} as Account)).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});
		describe('When calling save in accountService if feature is disabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(false);
			};
			it('should not call save in accountServiceIdm', async () => {
				setup();

				await expect(accountService.save({} as Account)).resolves.not.toThrow();
				expect(accountServiceIdm.save).not.toHaveBeenCalled();
			});
		});
		describe('when identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
			};
			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.save({ username: 'username' })).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe('saveWithValidation', () => {
		describe('When calling saveWithValidation on accountService', () => {
			const setup = () => {
				const spy = jest.spyOn(accountService, 'save');
				return spy;
			};
			it('should not sanitize username for external user', async () => {
				const spy = setup();

				const params: Account = {
					username: ' John.Doe@domain.tld ',
					systemId: 'ABC123',
				};
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
				const params: Account = {
					username: 'John Doe',
					password: 'JohnsPassword',
				};
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username is not an email');
			});
		});

		describe('When username for an external user is not an email', () => {
			it('should not throw an error', async () => {
				const params: Account = {
					username: 'John Doe',
					systemId: 'ABC123',
				};
				await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
			});
		});

		describe('When username for an external user is a ldap search string', () => {
			it('should not throw an error', async () => {
				const params: Account = {
					username: 'dc=schul-cloud,dc=org/fake.ldap',
					systemId: 'ABC123',
				};
				await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
			});
		});

		describe('When no password is provided for an internal user', () => {
			it('should throw no password provided error', async () => {
				const params: Account = {
					username: 'john.doe@mail.tld',
				};
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('No password provided');
			});
		});

		describe('When account already exists', () => {
			it('should throw account already exists', async () => {
				const params: Account = {
					username: 'john.doe@mail.tld',
					password: 'JohnsPassword',
					userId: 'userId123',
				};
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
				const params: Account = {
					username: 'john.doe@mail.tld',
					password: 'JohnsPassword',
				};
				await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username already exists');
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
			};

			it('should call idm implementation', async () => {
				setup();
				await expect(
					accountService.saveWithValidation({ username: 'username@mail.tld', password: 'password' })
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
				configService.get.mockReturnValueOnce(true);
			};
			it('should call updateUsername in accountServiceIdm', async () => {
				setup();

				await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
				expect(accountServiceIdm.updateUsername).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling updateUsername in accountService if idm feature is disabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(false);
			};
			it('should not call updateUsername in accountServiceIdm', async () => {
				setup();

				await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
				expect(accountServiceIdm.updateUsername).not.toHaveBeenCalled();
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
			};

			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
			};

			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.updateLastTriedFailedLogin('accountId', new Date())).resolves.not.toThrow();
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
				configService.get.mockReturnValueOnce(true);
			};
			it('should call updatePassword in accountServiceIdm', async () => {
				setup();

				await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.updatePassword).toHaveBeenCalledTimes(1);
			});
		});

		describe('When calling updatePassword in accountService if feature is disabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(false);
			};
			it('should not call updatePassword in accountServiceIdm', async () => {
				setup();

				await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.updatePassword).not.toHaveBeenCalled();
			});
		});
		describe('When identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
			};

			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
		describe('when identity management is primary', () => {
			const setup = () => {
				configService.get.mockReturnValue(true);
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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
				return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
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

				const spyLogger = jest.spyOn(logger, 'error');

				return { testError, spyLogger };
			};
			it('should call executeIdmMethod and throw an error object', async () => {
				const { testError, spyLogger } = setup();

				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(spyLogger).toHaveBeenCalledWith(testError, expect.anything());
			});
		});

		describe('When idm feature is enabled', () => {
			const setup = () => {
				configService.get.mockReturnValueOnce(true);
				const spyLogger = jest.spyOn(logger, 'error');
				const deleteByUserIdMock = jest.spyOn(accountServiceIdm, 'deleteByUserId');
				deleteByUserIdMock.mockImplementationOnce(() => {
					// eslint-disable-next-line @typescript-eslint/no-throw-literal
					throw 'a non error object';
				});
				return { spyLogger };
			};
			it('should call executeIdmMethod and throw an error object', async () => {
				const { spyLogger } = setup();

				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(spyLogger).toHaveBeenCalledWith('a non error object');
			});
		});
	});
});
