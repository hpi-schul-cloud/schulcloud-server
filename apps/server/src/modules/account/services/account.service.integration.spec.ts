import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from '@shared/repo';
import { AccountDto, AccountSaveDto } from '@src/modules/account/services/dto';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { Logger } from '@src/core/logger';
import { IAccount } from '@shared/domain';
import { AccountService } from './account.service';
import { IdentityManagementService } from '../../../shared/infra/identity-management/identity-management.service';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let idmService: IdentityManagementService;

	const testAccount: AccountSaveDto = {
		username: 'john.doe@mail.tld',
	};
	const createAccount = async (): Promise<AccountDto> => {
		return accountService.save(testAccount);
	};
	const deleteAccount = async (accountId: string): Promise<void> => {
		return accountService.delete(accountId);
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					load: [
						() => ({
							FEATURE_KEYCLOAK_IDENTITY_STORE_ENABLED: true,
						}),
					],
				}),
				MongoMemoryDatabaseModule.forRoot(),
				IdentityManagementModule,
			],
			providers: [
				AccountRepo,
				AccountService,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		accountService = module.get(AccountService);
		idmService = module.get(IdentityManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('should mirror create, update and delete operations into the IDM', () => {
		it('save should create a new account', async () => {
			const account = await accountService.save(testAccount);
			const accounts = await idmService.getAllAccounts();

			expect(accounts).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);

			await deleteAccount(account.id);
		});

		it.skip('save should update existing account', async () => {
			const newUserName = 'jane.doe@mail.tld';
			const accountToUpdate = await createAccount();
			await accountService.save({
				username: newUserName,
			});
			const accounts = await idmService.getAllAccounts();

			expect(accounts).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);
			expect(accounts).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);
		});

		it.skip('updateUsername should update user name', async () => {});

		it.skip('updatePassword should update password', async () => {});

		it.skip('delete should remove account', async () => {
			const account = await createAccount();
			await accountService.delete(account.id);
			const accounts = await idmService.getAllAccounts();

			expect(accounts).not.toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						userName: testAccount.username,
					}),
				])
			);
		});

		it.skip('deleteByUserId should remove account', async () => {
			const accountToDelete = (await idmService.getAllAccounts()).find(
				(accountTemp) => accountTemp.userName === testAccount.username
			) as IAccount;
		});
	});
});
