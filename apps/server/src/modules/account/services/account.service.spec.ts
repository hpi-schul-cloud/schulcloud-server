import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IServerConfig } from '@src/modules/server';
import { LegacyLogger } from '../../../core/logger';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AccountService } from './account.service';
import { AccountValidationService } from './account.validation.service';
import { AccountDto, AccountSaveDto } from './dto';

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
					useValue: createMock<ConfigService<IServerConfig, true>>(),
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
		it('should call findById in accountServiceDb', async () => {
			await expect(accountService.findById('id')).resolves.not.toThrow();
			expect(accountServiceDb.findById).toHaveBeenCalledTimes(1);
		});
	});

	describe('findByUserId', () => {
		it('should call findByUserId in accountServiceDb', async () => {
			await expect(accountService.findByUserId('userId')).resolves.not.toThrow();
			expect(accountServiceDb.findByUserId).toHaveBeenCalledTimes(1);
		});
	});

	describe('findByUsernameAndSystemId', () => {
		it('should call findByUsernameAndSystemId in accountServiceDb', async () => {
			await expect(accountService.findByUsernameAndSystemId('username', 'systemId')).resolves.not.toThrow();
			expect(accountServiceDb.findByUsernameAndSystemId).toHaveBeenCalledTimes(1);
		});
	});

	describe('findMultipleByUserId', () => {
		it('should call findMultipleByUserId in accountServiceDb', async () => {
			await expect(accountService.findMultipleByUserId(['userId1, userId2'])).resolves.not.toThrow();
			expect(accountServiceDb.findMultipleByUserId).toHaveBeenCalledTimes(1);
		});
	});

	describe('findByUserIdOrFail', () => {
		it('should call findByUserIdOrFail in accountServiceDb', async () => {
			await expect(accountService.findByUserIdOrFail('userId')).resolves.not.toThrow();
			expect(accountServiceDb.findByUserIdOrFail).toHaveBeenCalledTimes(1);
		});
	});

	describe('save', () => {
		it('should call save in accountServiceDb', async () => {
			await expect(accountService.save({} as AccountSaveDto)).resolves.not.toThrow();
			expect(accountServiceDb.save).toHaveBeenCalledTimes(1);
		});
		it('should call save in accountServiceIdm if feature is enabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(true);

			await expect(accountService.save({} as AccountSaveDto)).resolves.not.toThrow();
			expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
		});
		it('should not call save in accountServiceIdm if feature is disabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(false);

			await expect(accountService.save({} as AccountSaveDto)).resolves.not.toThrow();
			expect(accountServiceIdm.save).not.toHaveBeenCalled();
		});
	});

	describe('saveWithValidation', () => {
		it('should not sanitize username for external user', async () => {
			const spy = jest.spyOn(accountService, 'save');
			const params: AccountSaveDto = {
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
		it('should throw if username for a local user is not an email', async () => {
			const params: AccountSaveDto = {
				username: 'John Doe',
				password: 'JohnsPassword',
			};
			await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username is not an email');
		});
		it('should not throw if username for an external user is not an email', async () => {
			const params: AccountSaveDto = {
				username: 'John Doe',
				systemId: 'ABC123',
			};
			await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
		});
		it('should not throw if username for an external user is a ldap search string', async () => {
			const params: AccountSaveDto = {
				username: 'dc=schul-cloud,dc=org/fake.ldap',
				systemId: 'ABC123',
			};
			await expect(accountService.saveWithValidation(params)).resolves.not.toThrow();
		});
		it('should throw if no password is provided for an internal user', async () => {
			const params: AccountSaveDto = {
				username: 'john.doe@mail.tld',
			};
			await expect(accountService.saveWithValidation(params)).rejects.toThrow('No password provided');
		});
		it('should throw if account already exists', async () => {
			const params: AccountSaveDto = {
				username: 'john.doe@mail.tld',
				password: 'JohnsPassword',
				userId: 'userId123',
			};
			accountServiceDb.findByUserId.mockResolvedValueOnce({ id: 'foundAccount123' } as AccountDto);
			await expect(accountService.saveWithValidation(params)).rejects.toThrow('Account already exists');
		});
		it('should throw if username already exists', async () => {
			const accountIsUniqueEmailSpy = jest.spyOn(accountValidationService, 'isUniqueEmail');
			accountIsUniqueEmailSpy.mockResolvedValueOnce(false);
			const params: AccountSaveDto = {
				username: 'john.doe@mail.tld',
				password: 'JohnsPassword',
			};
			await expect(accountService.saveWithValidation(params)).rejects.toThrow('Username already exists');
		});
	});

	describe('updateUsername', () => {
		it('should call updateUsername in accountServiceDb', async () => {
			await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
			expect(accountServiceDb.updateUsername).toHaveBeenCalledTimes(1);
		});
		it('should call updateUsername in accountServiceIdm if feature is enabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(true);

			await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
			expect(accountServiceIdm.updateUsername).toHaveBeenCalledTimes(1);
		});
		it('should not call updateUsername in accountServiceIdm if feature is disabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(false);

			await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
			expect(accountServiceIdm.updateUsername).not.toHaveBeenCalled();
		});
	});

	describe('updateLastTriedFailedLogin', () => {
		it('should call updateLastTriedFailedLogin in accountServiceDb', async () => {
			await expect(accountService.updateLastTriedFailedLogin('accountId', {} as Date)).resolves.not.toThrow();
			expect(accountServiceDb.updateLastTriedFailedLogin).toHaveBeenCalledTimes(1);
		});
	});

	describe('updatePassword', () => {
		it('should call updatePassword in accountServiceDb', async () => {
			await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
			expect(accountServiceDb.updatePassword).toHaveBeenCalledTimes(1);
		});
		it('should call updatePassword in accountServiceIdm if feature is enabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(true);

			await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
			expect(accountServiceIdm.updatePassword).toHaveBeenCalledTimes(1);
		});
		it('should not call updatePassword in accountServiceIdm if feature is disabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(false);

			await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
			expect(accountServiceIdm.updatePassword).not.toHaveBeenCalled();
		});
	});

	describe('validatePassword', () => {
		const setup = () => {
			configService.get.mockReturnValue(true);
			return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
		};
		it('should call validatePassword in accountServiceDb', async () => {
			await expect(accountService.validatePassword({} as AccountDto, 'password')).resolves.not.toThrow();
			expect(accountServiceIdm.validatePassword).toHaveBeenCalledTimes(0);
			expect(accountServiceDb.validatePassword).toHaveBeenCalledTimes(1);
		});
		it('should call validatePassword in accountServiceIdm if feature is enabled', async () => {
			const service = setup();
			await expect(service.validatePassword({} as AccountDto, 'password')).resolves.not.toThrow();
			expect(accountServiceDb.validatePassword).toHaveBeenCalledTimes(0);
			expect(accountServiceIdm.validatePassword).toHaveBeenCalledTimes(1);
		});
	});

	describe('delete', () => {
		it('should call delete in accountServiceDb', async () => {
			await expect(accountService.delete('accountId')).resolves.not.toThrow();
			expect(accountServiceDb.delete).toHaveBeenCalledTimes(1);
		});
		it('should call delete in accountServiceIdm if feature is enabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(true);

			await expect(accountService.delete('accountId')).resolves.not.toThrow();
			expect(accountServiceIdm.delete).toHaveBeenCalledTimes(1);
		});
		it('should not call delete in accountServiceIdm if feature is disabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(false);

			await expect(accountService.delete('accountId')).resolves.not.toThrow();
			expect(accountServiceIdm.delete).not.toHaveBeenCalled();
		});
	});

	describe('deleteByUserId', () => {
		it('should call deleteByUserId in accountServiceDb', async () => {
			await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
			expect(accountServiceDb.deleteByUserId).toHaveBeenCalledTimes(1);
		});
		it('should call deleteByUserId in accountServiceIdm if feature is enabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(true);

			await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
			expect(accountServiceIdm.deleteByUserId).toHaveBeenCalledTimes(1);
		});
		it('should not call deleteByUserId in accountServiceIdm if feature is disabled', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(false);

			await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
			expect(accountServiceIdm.deleteByUserId).not.toHaveBeenCalled();
		});
	});

	describe('findMany', () => {
		it('should call findMany in accountServiceDb', async () => {
			await expect(accountService.findMany()).resolves.not.toThrow();
			expect(accountServiceDb.findMany).toHaveBeenCalledTimes(1);
		});
	});

	describe('searchByUsernamePartialMatch', () => {
		it('should call searchByUsernamePartialMatch in accountServiceDb', async () => {
			await expect(accountService.searchByUsernamePartialMatch('username', 1, 1)).resolves.not.toThrow();
			expect(accountServiceDb.searchByUsernamePartialMatch).toHaveBeenCalledTimes(1);
		});
	});

	describe('searchByUsernameExactMatch', () => {
		it('should call searchByUsernameExactMatch in accountServiceDb', async () => {
			await expect(accountService.searchByUsernameExactMatch('username')).resolves.not.toThrow();
			expect(accountServiceDb.searchByUsernameExactMatch).toHaveBeenCalledTimes(1);
		});
	});

	describe('executeIdmMethod', () => {
		it('should throw an error object', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(true);
			const spyLogger = jest.spyOn(logger, 'error');
			const testError = new Error('error');

			const deleteByUserIdMock = jest.spyOn(accountServiceIdm, 'deleteByUserId');
			deleteByUserIdMock.mockImplementationOnce(() => {
				throw testError;
			});

			await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
			expect(spyLogger).toHaveBeenCalledWith(testError, expect.anything());
		});

		it('should throw an non error object', async () => {
			const spy = jest.spyOn(configService, 'get');
			spy.mockReturnValueOnce(true);
			const spyLogger = jest.spyOn(logger, 'error');

			const deleteByUserIdMock = jest.spyOn(accountServiceIdm, 'deleteByUserId');
			deleteByUserIdMock.mockImplementationOnce(() => {
				// eslint-disable-next-line @typescript-eslint/no-throw-literal
				throw 'a non error object';
			});

			await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
			expect(spyLogger).toHaveBeenCalledWith('a non error object');
		});
	});

	describe('when identity management is primary', () => {
		const setup = () => {
			configService.get.mockReturnValue(true);
			return new AccountService(accountServiceDb, accountServiceIdm, configService, accountValidationService, logger);
		};

		describe('findById', () => {
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findById('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.findById).toHaveBeenCalledTimes(1);
			});
		});

		describe('findMultipleByUserId', () => {
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findMultipleByUserId(['userId'])).resolves.not.toThrow();
				expect(accountServiceIdm.findMultipleByUserId).toHaveBeenCalledTimes(1);
			});
		});

		describe('findByUserId', () => {
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.findByUserId).toHaveBeenCalledTimes(1);
			});
		});

		describe('findByUserIdOrFail', () => {
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findByUserIdOrFail('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.findByUserIdOrFail).toHaveBeenCalledTimes(1);
			});
		});

		describe('findByUsernameAndSystemId', () => {
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.findByUsernameAndSystemId('username', 'systemId')).resolves.not.toThrow();
				expect(accountServiceIdm.findByUsernameAndSystemId).toHaveBeenCalledTimes(1);
			});
		});

		describe('searchByUsernamePartialMatch', () => {
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.searchByUsernamePartialMatch('username', 0, 1)).resolves.not.toThrow();
				expect(accountServiceIdm.searchByUsernamePartialMatch).toHaveBeenCalledTimes(1);
			});
		});

		describe('searchByUsernameExactMatch', () => {
			it('should call idm implementation', async () => {
				const service = setup();
				await expect(service.searchByUsernameExactMatch('username')).resolves.not.toThrow();
				expect(accountServiceIdm.searchByUsernameExactMatch).toHaveBeenCalledTimes(1);
			});
		});

		describe('save', () => {
			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.save({ username: 'username' })).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('saveWithValidation', () => {
			it('should call idm implementation', async () => {
				setup();
				await expect(
					accountService.saveWithValidation({ username: 'username@mail.tld', password: 'password' })
				).resolves.not.toThrow();
				expect(accountServiceIdm.save).toHaveBeenCalledTimes(1);
			});
		});

		describe('updateUsername', () => {
			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.updateUsername('accountId', 'username')).resolves.not.toThrow();
				expect(accountServiceIdm.updateUsername).toHaveBeenCalledTimes(1);
			});
		});

		describe('updateLastTriedFailedLogin', () => {
			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.updateLastTriedFailedLogin('accountId', new Date())).resolves.not.toThrow();
				expect(accountServiceIdm.updateLastTriedFailedLogin).toHaveBeenCalledTimes(1);
			});
		});

		describe('updatePassword', () => {
			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.updatePassword('accountId', 'password')).resolves.not.toThrow();
				expect(accountServiceIdm.updatePassword).toHaveBeenCalledTimes(1);
			});
		});

		describe('delete', () => {
			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.delete('accountId')).resolves.not.toThrow();
				expect(accountServiceIdm.delete).toHaveBeenCalledTimes(1);
			});
		});

		describe('deleteByUserId', () => {
			it('should call idm implementation', async () => {
				setup();
				await expect(accountService.deleteByUserId('userId')).resolves.not.toThrow();
				expect(accountServiceIdm.deleteByUserId).toHaveBeenCalledTimes(1);
			});
		});
	});
});
