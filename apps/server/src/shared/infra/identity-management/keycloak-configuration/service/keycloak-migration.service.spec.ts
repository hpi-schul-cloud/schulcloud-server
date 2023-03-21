import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { KeycloakMigrationService } from './keycloak-migration.service';

const chunkSize = 100;
describe('KeycloakMigrationService', () => {
	let module: TestingModule;
	let service: KeycloakMigrationService;

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
			],
		}).compile();
		service = module.get(KeycloakMigrationService);
	});

	describe('migrate', () => {
		describe('When all affected accounts are OK', () => {
			it('migration should handle chunks of 100 accounts', async () => {
				maxAccounts = 1000;
				const migratedAccountCounts = await service.migrate();
				expect(migratedAccountCounts.amount).toBe(100);
			});
			it('migration should log all account ids (old and new)', async () => {
				maxAccounts = 90;
				const migratedAccountCounts = await service.migrate();
				expect(migratedAccountCounts.amount).toBe(maxAccounts);
				expect(migratedAccountCounts.infos.length).toBe(maxAccounts);
			});
		});
		describe('When skip was set', () => {
			it('migration should skip the first "skip" accounts', async () => {
				maxAccounts = 120;
				const skip = 100;
				const migratedAccountCounts = await service.migrate(skip);
				expect(migratedAccountCounts.amount).toBe(maxAccounts - skip);
			});
			it('migration should skip if max reached', async () => {
				maxAccounts = 1000;
				const migratedAccountCounts = await service.migrate(maxAccounts);
				expect(migratedAccountCounts.amount).toBe(0);
			});
		});
		describe('When query was set', () => {
			it('migration should forward the query', async () => {
				maxAccounts = 1;
				const queryString = 'test';
				const ret = await service.migrate(0, queryString);
				expect(ret.infos).toContainEqual(expect.stringContaining(queryString));
			});
		});
		describe('When error cases exists', () => {
			it('should log all errors ', async () => {
				maxAccounts = 1110;
				const start = 1090;
				const migratedAccountCounts = await service.migrate(start);
				expect(migratedAccountCounts.amount).toBe(maxAccounts - start);
				expect(migratedAccountCounts.infos.length).toBe(maxAccounts - start - 1);
				expect(migratedAccountCounts.errors.length).toBe(1);
				expect(migratedAccountCounts.errors).toContainEqual(expect.stringContaining(errorAccountId));
			});
		});
	});
});
