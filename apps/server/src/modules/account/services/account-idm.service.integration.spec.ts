import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { AccountDto, AccountSaveDto } from '@src/modules/account/services/dto';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak/service/keycloak-administration.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { IKeycloakSettings, KeycloakSettings } from '@shared/infra/identity-management/keycloak/interface';
import { KeycloakIdentityManagementService } from '@shared/infra/identity-management/keycloak/service/keycloak-identity-management.service';
import { IAccount, IAccountUpdate } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import { NotImplementedException } from '@nestjs/common/exceptions/not-implemented.exception';
import { AccountRepo } from '../repo/account.repo';
import { IdentityManagementService } from '../../../shared/infra/identity-management/identity-management.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountServiceIdm } from './account-idm.service';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let identityManegementService: IdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let isIdmReachable = false;
	let accountIdmService: AbstractAccountService;

	const testRealm = 'test-realm';
	const testAccount = new AccountSaveDto({
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
	});
	const createAccount = async (): Promise<AccountDto> => {
		return accountIdmService.save(testAccount);
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
				AccountServiceIdm,
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
		accountIdmService = module.get(AccountServiceIdm);
		identityManegementService = module.get(IdentityManagementService);
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

		const createdAccount = await createAccount();
		const accounts = await identityManegementService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccount>({
					id: createdAccount.refId ?? 'undefined',
					username: testAccount.username,
				}),
			])
		);
	});

	it('save should update existing account', async () => {
		if (!isIdmReachable) return;

		const newUsername = 'jane.doe@mail.tld';
		const account = await createAccount();
		await accountIdmService.save({
			id: account.id,
			username: newUsername,
		});
		const accounts = await identityManegementService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccountUpdate>({
					// id: account.id,
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
		await accountIdmService.updateUsername(account.id, newUserName);
		const accounts = await identityManegementService.getAllAccounts();

		expect(accounts).toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccountUpdate>({
					username: newUserName,
				}),
			])
		);
		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccountUpdate>({
					username: testAccount.username,
				}),
			])
		);
	});

	it('updatePassword should update password', async () => {
		if (!isIdmReachable) return;

		const account = await createAccount();
		await expect(accountIdmService.updatePassword(account.id, 'newPassword')).resolves.not.toThrow();
	});

	it('delete should remove account', async () => {
		if (!isIdmReachable) return;

		const account = await createAccount();
		await accountIdmService.delete(account.id);
		const accounts = await identityManegementService.getAllAccounts();

		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccountUpdate>({
					username: testAccount.username,
				}),
			])
		);
	});

	it('deleteByUserId should remove account', async () => {
		if (!isIdmReachable) return;

		const account = await createAccount();
		await accountIdmService.deleteByUserId(account.userId as string);
		const accounts = await identityManegementService.getAllAccounts();

		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccountUpdate>({
					username: testAccount.username,
				}),
			])
		);
	});

	describe('Not implemented method', () => {
		it('findById should throw', async () => {
			await expect(accountIdmService.findById('id')).rejects.toThrow(NotImplementedException);
		});

		it('findMultipleByUserId should throw', async () => {
			await expect(accountIdmService.findMultipleByUserId(['id1', 'id2'])).rejects.toThrow(NotImplementedException);
		});

		it('findByUserId should throw', async () => {
			await expect(accountIdmService.findByUserId('id')).rejects.toThrow(NotImplementedException);
		});

		it('findByUserIdOrFail should throw', async () => {
			await expect(accountIdmService.findByUserIdOrFail('id')).rejects.toThrow(NotImplementedException);
		});

		it('findByUsernameAndSystemId should throw', async () => {
			await expect(accountIdmService.findByUsernameAndSystemId('id1', 'id2')).rejects.toThrow(NotImplementedException);
		});

		it('searchByUsernamePartialMatch should throw', async () => {
			await expect(accountIdmService.searchByUsernamePartialMatch('username', 0, 10)).rejects.toThrow(
				NotImplementedException
			);
		});

		it('searchByUsernameExactMatch should throw', async () => {
			await expect(accountIdmService.searchByUsernameExactMatch('username')).rejects.toThrow(NotImplementedException);
		});

		it('updateLastTriedFailedLogin should throw', async () => {
			await expect(accountIdmService.updateLastTriedFailedLogin('id', new Date())).rejects.toThrow(
				NotImplementedException
			);
		});
	});
});
