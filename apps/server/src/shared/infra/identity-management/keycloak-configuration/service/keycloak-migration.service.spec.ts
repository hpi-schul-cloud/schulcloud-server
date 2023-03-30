import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { KeycloakMigrationService } from './keycloak-migration.service';

describe('KeycloakMigrationService', () => {
	let module: TestingModule;
	let service: KeycloakMigrationService;
	let logger: DeepMocked<LegacyLogger>;

	let infoLogSpy: jest.SpyInstance;
	let errorLogSpy: jest.SpyInstance;

	let maxAccounts = 0;
	const errorAccountId = '1100';

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakMigrationService,
				{
					provide: AccountService,
					useValue: {
						save: jest.fn().mockImplementation((account: AccountDto): Promise<Partial<AccountDto>> => {
							if (account.id === errorAccountId) {
								return Promise.resolve({ idmReferenceId: undefined });
							}
							return Promise.resolve({ idmReferenceId: `New${account.id}` });
						}),
						searchByUsernamePartialMatch: jest
							.fn()
							.mockImplementation(
								(
									query: string,
									skip: number,
									amount: number
								): Promise<{ accounts: Partial<AccountDto>[]; total: number }> => {
									if (skip >= maxAccounts) {
										return Promise.resolve({ accounts: [], total: 0 });
									}
									const accountArr = Array.from({ length: Math.min(amount, maxAccounts - skip) }, (value, index) => {
										return { id: (index + skip).toString() + query };
									});
									return Promise.resolve({
										accounts: accountArr,
										total: amount,
									});
								}
							),
					},
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		service = module.get(KeycloakMigrationService);
		logger = module.get(LegacyLogger);
		infoLogSpy = jest.spyOn(logger, 'log');
		errorLogSpy = jest.spyOn(logger, 'error');
	});

	beforeEach(() => {
		infoLogSpy.mockReset();
		errorLogSpy.mockReset();
	});

	describe('migrate', () => {
		describe('When all affected accounts are OK', () => {
			it('migration should handle all accounts', async () => {
				maxAccounts = 1000;
				const migratedAccountCounts = await service.migrate();
				expect(migratedAccountCounts).toBe(maxAccounts);
			});
			it('migration should log every 100 entries', async () => {
				maxAccounts = 1000;
				await service.migrate();
				expect(infoLogSpy).toHaveBeenCalledTimes(maxAccounts / 100 + 1);
			});
		});
		describe('When verbose is set', () => {
			it('migration should log all account ids (old and new)', async () => {
				maxAccounts = 1000;
				const migratedAccountCounts = await service.migrate(0, '', true);
				expect(migratedAccountCounts).toBe(maxAccounts);
				expect(infoLogSpy).toHaveBeenCalledTimes(maxAccounts);
			});
		});
		describe('When skip was set', () => {
			it('migration should skip the first "skip" accounts', async () => {
				maxAccounts = 1000;
				const skip = 830;
				const migratedAccountCounts = await service.migrate(skip);
				expect(migratedAccountCounts).toBe(maxAccounts - skip);
			});
			it('migration should skip if max reached', async () => {
				maxAccounts = 1000;
				const migratedAccountCounts = await service.migrate(maxAccounts);
				expect(migratedAccountCounts).toBe(0);
			});
		});
		describe('When query was set', () => {
			it('migration should forward the query', async () => {
				maxAccounts = 1;
				const queryString = 'test';
				const migratedAccountCounts = await service.migrate(0, queryString, true);
				expect(infoLogSpy).toHaveBeenCalledTimes(migratedAccountCounts);
				expect(infoLogSpy).toHaveBeenCalledWith(expect.stringContaining(queryString));
			});
		});
		describe('When error cases exists', () => {
			it('should log all errors ', async () => {
				maxAccounts = 1200;
				const migratedAccountCounts = await service.migrate();
				expect(migratedAccountCounts).toBe(maxAccounts - 1);
				expect(errorLogSpy).toHaveBeenCalledTimes(1);
				expect(errorLogSpy).toHaveBeenCalledWith(expect.stringContaining(errorAccountId));
			});
		});
	});
});
