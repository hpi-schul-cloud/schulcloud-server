import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from '@shared/repo';
import { AccountDto, AccountSaveDto } from '@src/modules/account/services/dto';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { Logger } from '@src/core/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak/service/keycloak-administration.service';
import { AccountService } from './account.service';
import { IdentityManagementService } from '../../../shared/infra/identity-management/identity-management.service';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let idmService: IdentityManagementService;
	let isIdmReachable = false;

	const testAccount: AccountSaveDto = {
		username: 'john.doe@mail.tld',
		userId: new ObjectId().toString(),
		password: 'password',
	};
	const createAccount = async (): Promise<AccountDto> => {
		const result = await accountService.searchByUsernameExactMatch(testAccount.username);
		if (result.total === 0) {
			return accountService.save(testAccount);
		}
		return result.accounts[0];
	};
	const deleteAccount = async (username?: string): Promise<void> => {
		const result = await accountService.searchByUsernameExactMatch(username ?? testAccount.username);
		if (result.total !== 0) {
			await accountService.delete(result.accounts[0].id);
		}
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
		isIdmReachable = await module.get(KeycloakAdministrationService).testKcConnection();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await deleteAccount();
	});

	it('save should create a new account', async () => {
		if (!isIdmReachable) return;

		await createAccount();
		const accounts = await idmService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					userName: testAccount.username,
				}),
			])
		);
	});

	it.skip('save should update existing account', async () => {
		if (!isIdmReachable) return;

		const newUserName = 'jane.doe@mail.tld';
		await createAccount();
		await accountService.save({
			username: newUserName,
		});
		const accounts = await idmService.getAllAccounts();

		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					userName: newUserName,
				}),
			])
		);

		await deleteAccount(newUserName);
	});

	it.skip('updateUsername should update username', async () => {
		if (!isIdmReachable) return;

		const newUserName = 'jane.doe@mail.tld';
		const account = await createAccount();
		await accountService.updateUsername(account.id, newUserName);
		const accounts = await idmService.getAllAccounts();

		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					userName: newUserName,
				}),
			])
		);

		await deleteAccount(newUserName);
	});

	it('updatePassword should update password', async () => {
		if (!isIdmReachable) return;

		const account = await createAccount();
		await expect(accountService.updatePassword(account.id, 'newPassword')).resolves.not.toThrow();
	});

	it('delete should remove account', async () => {
		if (!isIdmReachable) return;

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

	it('deleteByUserId should remove account', async () => {
		if (!isIdmReachable) return;

		const account = await createAccount();
		await accountService.deleteByUserId(account.userId as string);
		const accounts = await idmService.getAllAccounts();

		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					userName: testAccount.username,
				}),
			])
		);
	});
});
