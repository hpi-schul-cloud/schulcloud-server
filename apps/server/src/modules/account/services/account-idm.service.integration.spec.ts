import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountRepo } from '@shared/repo';
import { AccountDto, AccountSaveDto } from '@src/modules/account/services/dto';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak/service/keycloak-administration.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { IKeycloakSettings, KeycloakSettings } from '@shared/infra/identity-management/keycloak/interface';
import { KeycloakIdentityManagementService } from '@shared/infra/identity-management/keycloak/service/keycloak-identity-management.service';
import { IAccount } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from './account.service';
import { IdentityManagementService } from '../../../shared/infra/identity-management/identity-management.service';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let accountService: AccountService;
	let idmService: IdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let isIdmReachable = false;

	const testRealm = 'test-realm';
	const testAccount = new AccountSaveDto({
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
	});
	const createAccount = async (): Promise<AccountDto> => {
		return accountService.save(testAccount);
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot(),
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
			],
			providers: [
				AccountRepo,
				AccountService,
				KeycloakAdministrationService,
				{ provide: IdentityManagementService, useClass: KeycloakIdentityManagementService },
				{
					provide: KeycloakAdminClient,
					useValue: new KeycloakAdminClient(),
				},
				{
					provide: KeycloakSettings,
					useValue: {
						clientId: 'admin-cli',
						baseUrl: 'http://localhost:8080',
						realmName: 'master',
						credentials: {
							clientId: 'admin-cli',
							username: 'keycloak',
							password: 'keycloak',
							grantType: 'password',
						},
					} as IKeycloakSettings,
				},
			],
		}).compile();
		accountService = module.get(AccountService);
		idmService = module.get(IdentityManagementService);
		keycloakAdminService = module.get(KeycloakAdministrationService);
		isIdmReachable = await keycloakAdminService.testKcConnection();
		if (isIdmReachable) {
			keycloak = await keycloakAdminService.callKcAdminClient();
		}
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		if (isIdmReachable) {
			await keycloak.realms.create({ realm: testRealm, editUsernameAllowed: true });
			keycloak.setConfig({ realmName: testRealm });
		}
	});

	afterEach(async () => {
		if (isIdmReachable) {
			await keycloak.realms.del({ realm: testRealm });
		}
	});

	it('save should create a new account', async () => {
		if (!isIdmReachable) return;

		await createAccount();
		const accounts = await idmService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccount>({
					username: testAccount.username,
				}),
			])
		);
	});

	it('save should update existing account', async () => {
		if (!isIdmReachable) return;

		const newUsername = 'jane.doe@mail.tld';
		const account = await createAccount();
		await accountService.save({
			id: account.id,
			username: newUsername,
		});
		const accounts = await idmService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccount>({
					username: newUsername,
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
				expect.objectContaining<IAccount>({
					username: newUserName,
				}),
			])
		);
		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccount>({
					username: testAccount.username,
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
				expect.objectContaining<IAccount>({
					username: testAccount.username,
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
				expect.objectContaining<IAccount>({
					username: testAccount.username,
				}),
			])
		);
	});
});
