import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacyLogger } from '@src/core/logger';
import { AccountService } from '@modules/account/services/account.service';
import { Account } from '@modules/account/domain/account';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { Users } from '@keycloak/keycloak-admin-client/lib/resources/users';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import { KeycloakMigrationService } from './keycloak-migration.service';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';

describe('KeycloakMigrationService', () => {
	let module: TestingModule;
	let service: KeycloakMigrationService;
	let logger: DeepMocked<LegacyLogger>;

	let infoLogSpy: jest.SpyInstance;
	let errorLogSpy: jest.SpyInstance;

	let maxAccounts = 0;
	const existingAccountId = '900';
	const errorAccountId = '1100';

	let kcAdminClient: DeepMocked<KeycloakAdminClient>;
	const kcApiUsersMock = createMock<Users>();

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				KeycloakMigrationService,
				{
					provide: AccountService,
					useValue: {
						findMany: jest.fn().mockImplementation((skip: number, amount: number): Promise<Partial<Account>[]> => {
							if (skip >= maxAccounts) {
								return Promise.resolve([]);
							}
							const accountArr = Array.from({ length: Math.min(amount, maxAccounts - skip) }, (value, index) => {
								const mockId = (index + skip).toString();
								return { id: mockId, username: mockId };
							});
							return Promise.resolve(accountArr);
						}),
					},
				},
				{
					provide: KeycloakAdministrationService,
					useValue: {
						callKcAdminClient: jest
							.fn()
							.mockImplementation(async (): Promise<KeycloakAdminClient> => Promise.resolve(kcAdminClient)),
					},
				},
				{
					provide: KeycloakAdminClient,
					useValue: createMock<KeycloakAdminClient>({
						auth: (): Promise<void> => Promise.resolve(),
						setConfig: () => {},
						users: kcApiUsersMock,
					}),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		service = module.get(KeycloakMigrationService);
		kcAdminClient = module.get(KeycloakAdminClient);

		kcApiUsersMock.create.mockResolvedValue({ id: 'new-idm-id' });
		kcApiUsersMock.find.mockImplementation(async (arg): Promise<UserRepresentation[]> => {
			if (arg?.username === existingAccountId) {
				return Promise.resolve([{ id: 'existing-dbaccount-id' }]);
			}
			if (arg?.username === errorAccountId) {
				return Promise.resolve([{ id: 'existing-dbaccount-id-1' }, { id: 'existing-dbaccount-id-2' }]);
			}
			return Promise.resolve([]);
		});

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
				const migratedAccountCounts = await service.migrate(0, true);
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
		describe('When error cases exists', () => {
			it('should log all errors ', async () => {
				maxAccounts = 1200;
				const migratedAccountCounts = await service.migrate();
				expect(migratedAccountCounts).toBe(maxAccounts - 1);
				expect(errorLogSpy).toHaveBeenCalledTimes(1);
				expect(errorLogSpy).toHaveBeenCalledWith(expect.stringContaining(errorAccountId), expect.anything());
			});
		});
	});
});
