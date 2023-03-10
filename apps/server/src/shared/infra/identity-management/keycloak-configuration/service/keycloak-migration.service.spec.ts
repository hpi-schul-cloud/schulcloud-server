import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto/account.dto';
import { KeycloakMigrationService } from './keycloak-migration.service';

describe('KeycloakSeedService', () => {
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
							return Promise.resolve({ idmReferenceId: 'aValidId' });
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
									const accountArr = Array.from({ length: amount }, (value, index) => {
										return { id: (index + skip).toString() };
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
		it('should handle all accounts', async () => {
			// GIVEN
			maxAccounts = 1000;
			// WHEN
			const [migratedAccountCounts, err] = await service.migrate();
			// THEN
			expect(migratedAccountCounts).toBe(maxAccounts);
			expect(err).toHaveLength(0);
		});
		it('should log all errors ', async () => {
			// GIVEN
			maxAccounts = 1200;
			// WHEN
			const [migratedAccountCounts, err] = await service.migrate();
			// THEN
			expect(migratedAccountCounts).toBe(maxAccounts - 1);
			expect(err).toHaveLength(1);
			expect(err[0]).toContain(errorAccountId);
		});
	});
});
