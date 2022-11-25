import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from '@shared/repo';
import { AccountDto } from '@src/modules/account/services/dto';
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
	let keycloakService: KeycloakAdministrationService;
	let isIdmReachable = false;

	const testRealm = 'test-realm';
	const testAccount = {
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
	const deleteAccounts = async (): Promise<void> => {
		const result = await accountService.searchByUsernamePartialMatch('doe@mail.tld', 0, 10);
		// eslint-disable-next-line no-restricted-syntax
		for (const account of result.accounts) {
			// eslint-disable-next-line no-await-in-loop
			await accountService.delete(account.id);
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
		keycloakService = module.get(KeycloakAdministrationService);
		isIdmReachable = await keycloakService.testKcConnection();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		const kc = await keycloakService.callKcAdminClient();
		await kc.realms.create({ realm: testRealm });
		kc.setConfig({ realmName: testRealm });
	});

	afterEach(async () => {
		const kc = await keycloakService.callKcAdminClient();
		await kc.realms.del({ realm: testRealm });
		await deleteAccounts();
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

	it('save should update existing account', async () => {
		if (!isIdmReachable) return;

		const newUserName = 'jane.doe@mail.tld';
		const account = await createAccount();
		await accountService.save({
			id: account.id,
			username: newUserName,
		});
		const accounts = await idmService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					userName: newUserName,
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

	it('updateUsername should update username', async () => {
		if (!isIdmReachable) return;

		const newUserName = 'jane.doe@mail.tld';
		const account = await createAccount();
		await accountService.updateUsername(account.id, newUserName);
		const accounts = await idmService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					userName: newUserName,
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
