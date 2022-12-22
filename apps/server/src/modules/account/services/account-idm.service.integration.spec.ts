import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AccountSaveDto } from '@src/modules/account/services/dto';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak/service/keycloak-administration.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { KeycloakSettings } from '@shared/infra/identity-management/keycloak/interface';
import { KeycloakIdentityManagementService } from '@shared/infra/identity-management/keycloak/service/keycloak-identity-management.service';
import { IAccount } from '@shared/domain';
import { ObjectId } from '@mikro-orm/mongodb';
import KeycloakConfiguration from '@shared/infra/identity-management/keycloak/keycloak-config';
import { IdentityManagementService } from '../../../shared/infra/identity-management/identity-management.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountServiceIdm } from './account-idm.service';

describe('AccountService IDM Integration', () => {
	let module: TestingModule;
	let identityManagementService: IdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let isIdmReachable: boolean;
	let accountIdmService: AbstractAccountService;

	const testRealm = 'test-realm';
	const technicalRefId = 'aTechnicalReferenceId';
	const testAccount = new AccountSaveDto({
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
		systemId: new ObjectId().toString(),
		idmReferenceId: technicalRefId,
	});
	const createAccount = async (): Promise<string> => {
		return identityManagementService.createAccount(
			{
				username: testAccount.username,
				attRefFunctionalIntId: testAccount.userId,
				attRefFunctionalExtId: testAccount.systemId,
				attRefTechnicalId: technicalRefId,
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
							FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: true,
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
					useValue: KeycloakConfiguration.keycloakSettings,
				},
			],
		}).compile();
		accountIdmService = module.get(AccountServiceIdm);
		identityManagementService = module.get(IdentityManagementService);
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
		const foundAccount = await identityManagementService.findAccountById(createdAccount.idmReferenceId ?? '');

		expect(foundAccount).toEqual(
			expect.objectContaining<IAccount>({
				id: createdAccount.idmReferenceId ?? '',
				username: createdAccount.username,
				attRefTechnicalId: technicalRefId,
				attRefFunctionalIntId: createdAccount.userId,
				attRefFunctionalExtId: createdAccount.systemId,
			})
		);
	});

	it('save should update existing account', async () => {
		if (!isIdmReachable) return;
		const newUsername = 'jane.doe@mail.tld';
		const idmId = await createAccount();

		const updatedAccount = await accountIdmService.save({
			id: technicalRefId,
			username: newUsername,
		});
		const foundAccount = await identityManagementService.findAccountById(idmId);

		expect(foundAccount).toEqual(
			expect.objectContaining<IAccount>({
				id: updatedAccount.idmReferenceId ?? '',
				username: updatedAccount.username,
				attRefTechnicalId: technicalRefId,
				attRefFunctionalIntId: updatedAccount.userId,
				attRefFunctionalExtId: updatedAccount.systemId,
			})
		);
	});

	it('updateUsername should update username', async () => {
		if (!isIdmReachable) return;
		const newUserName = 'jane.doe@mail.tld';
		const idmId = await createAccount();
		await accountIdmService.updateUsername(technicalRefId, newUserName);

		const foundAccount = await identityManagementService.findAccountById(idmId);

		expect(foundAccount).toEqual(
			expect.objectContaining<Partial<IAccount>>({
				username: newUserName,
			})
		);
	});

	it('updatePassword should update password', async () => {
		if (!isIdmReachable) return;
		await createAccount();
		await expect(accountIdmService.updatePassword(technicalRefId, 'newPassword')).resolves.not.toThrow();
	});

	it('delete should remove account', async () => {
		if (!isIdmReachable) return;
		const idmId = await createAccount();
		const foundAccount = await identityManagementService.findAccountById(idmId);
		expect(foundAccount).toBeDefined();

		await accountIdmService.delete(technicalRefId);
		await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
	});

	it('deleteByUserId should remove account', async () => {
		if (!isIdmReachable) return;
		const idmId = await createAccount();
		const foundAccount = await identityManagementService.findAccountById(idmId);
		expect(foundAccount).toBeDefined();

		await accountIdmService.deleteByUserId(testAccount.userId ?? '');
		await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
	});
});
