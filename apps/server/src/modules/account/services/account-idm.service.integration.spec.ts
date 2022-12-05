import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak/service/keycloak-administration.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { IKeycloakSettings, KeycloakSettings } from '@shared/infra/identity-management/keycloak/interface';
import { KeycloakIdentityManagementService } from '@shared/infra/identity-management/keycloak/service/keycloak-identity-management.service';
import { IAccount, IAccountUpdate } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
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
	const testAccountId = new ObjectId().toString();
	const testAccount = new AccountSaveDto({
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
		systemId: new ObjectId().toString(),
	});
	const createAccount = async (): Promise<string> => {
		return identityManegementService.createAccount(
			{
				username: testAccount.username,
				attRefFunctionalIntId: testAccount.userId,
				attRefFunctionalExtId: testAccount.systemId,
				attRefTechnicalId: testAccount.id,
			},
			testAccount.password
		);
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
			],
			providers: [
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

		const createdAccount = await accountIdmService.save(testAccount);
		const foundAccount = await identityManegementService.findAccountById(createdAccount.id);

		expect(foundAccount).toEqual(
			expect.objectContaining<IAccount>({
				id: createdAccount.id,
				username: createdAccount.username,
				attRefTechnicalId: createdAccount.id,
				attRefFunctionalIntId: createdAccount.userId,
				attRefFunctionalExtId: createdAccount.systemId,
			})
		);
	});

	it('save should update existing account', async () => {
		if (!isIdmReachable) return;

		const newUsername = 'jane.doe@mail.tld';
		await createAccount();

		const updatedAccount = await accountIdmService.save({
			id: testAccountId,
			username: newUsername,
		});
		const foundAccount = await identityManegementService.findAccountByTecRefId(updatedAccount.id);

		expect(foundAccount).toEqual(
			expect.objectContaining<IAccount>({
				id: updatedAccount.id,
				username: updatedAccount.username,
				attRefTechnicalId: updatedAccount.id,
				attRefFunctionalIntId: updatedAccount.userId,
				attRefFunctionalExtId: updatedAccount.systemId,
			})
		);
	});

	it('updateUsername should update username', async () => {
		if (!isIdmReachable) return;

		const newUserName = 'jane.doe@mail.tld';
		const account = await createAccount();
		await accountIdmService.updateUsername(testAccountId, newUserName);
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
		await expect(accountIdmService.updatePassword(testAccountId, 'newPassword')).resolves.not.toThrow();
	});

	it('delete should remove account', async () => {
		if (!isIdmReachable) return;

		const account = await createAccount();
		await accountIdmService.delete(testAccountId);
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
		await accountIdmService.deleteByUserId(testAccount.userId as string);
		const accounts = await identityManegementService.getAllAccounts();

		expect(accounts).not.toEqual(
			expect.arrayContaining([
				expect.objectContaining<IAccountUpdate>({
					username: testAccount.username,
				}),
			])
		);
	});
});
