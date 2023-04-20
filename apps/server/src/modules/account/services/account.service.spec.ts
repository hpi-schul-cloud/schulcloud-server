import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { IServerConfig } from '@src/modules/server';
import { Logger } from '../../../core/logger';
import { AccountService } from './account.service';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountDto, AccountSaveDto } from './dto';
import { AccountValidationService } from './account.validation.service';

describe('AccountService', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let accountServiceIdm: DeepMocked<AbstractAccountService>;
	let accountServiceDb: DeepMocked<AbstractAccountService>;
	let accountValidationService: DeepMocked<AccountValidationService>;
	let configService: DeepMocked<ConfigService>;
	let logger: DeepMocked<Logger>;

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
		logger = module.get(Logger);
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
});
