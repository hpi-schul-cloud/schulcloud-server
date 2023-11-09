import { v1 } from 'uuid';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IdmAccount } from '@shared/domain';
import { KeycloakAdministrationService } from '@shared/infra/identity-management/keycloak-administration/service/keycloak-administration.service';
import { AccountSaveDto } from '@modules/account/services/dto';
import { LoggerModule } from '@src/core/logger';
import { IdentityManagementModule } from '@shared/infra/identity-management';
import { IdentityManagementService } from '../../../shared/infra/identity-management/identity-management.service';
import { AccountIdmToDtoMapper, AccountIdmToDtoMapperDb } from '../mapper';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountLookupService } from './account-lookup.service';

describe('AccountIdmService Integration', () => {
	let module: TestingModule;
	let identityManagementService: IdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let isIdmReachable: boolean;
	let accountIdmService: AbstractAccountService;

	const testRealm = `test-realm-${v1()}`;
	const testDbcAccountId = new ObjectId().toString();
	const testAccount = new AccountSaveDto({
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
		systemId: new ObjectId().toString(),
		idmReferenceId: testDbcAccountId,
	});
	const createAccount = async (): Promise<string> =>
		identityManagementService.createAccount(
			{
				username: testAccount.username,
				attDbcUserId: testAccount.userId,
				attDbcSystemId: testAccount.systemId,
				attDbcAccountId: testDbcAccountId,
			},
			testAccount.password
		);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					validate: () => {
						return {
							FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: true,
							FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED: false,
						};
					},
				}),
				IdentityManagementModule,
				LoggerModule,
			],
			providers: [
				AccountServiceIdm,
				AccountLookupService,
				{
					provide: AccountIdmToDtoMapper,
					useClass: AccountIdmToDtoMapperDb,
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
			expect.objectContaining<IdmAccount>({
				id: createdAccount.idmReferenceId ?? '',
				username: createdAccount.username,
				attDbcAccountId: testDbcAccountId,
				attDbcUserId: createdAccount.userId,
				attDbcSystemId: createdAccount.systemId,
			})
		);
	});

	it('save should update existing account', async () => {
		if (!isIdmReachable) return;
		const newUsername = 'jane.doe@mail.tld';
		const idmId = await createAccount();

		await accountIdmService.save({
			id: testDbcAccountId,
			username: newUsername,
		});
		const foundAccount = await identityManagementService.findAccountById(idmId);

		expect(foundAccount).toEqual(
			expect.objectContaining<IdmAccount>({
				id: idmId,
				username: newUsername,
			})
		);
	});

	it('updateUsername should update username', async () => {
		if (!isIdmReachable) return;
		const newUserName = 'jane.doe@mail.tld';
		const idmId = await createAccount();
		await accountIdmService.updateUsername(testDbcAccountId, newUserName);

		const foundAccount = await identityManagementService.findAccountById(idmId);

		expect(foundAccount).toEqual(
			expect.objectContaining<Partial<IdmAccount>>({
				username: newUserName,
			})
		);
	});

	it('updatePassword should update password', async () => {
		if (!isIdmReachable) return;
		await createAccount();
		await expect(accountIdmService.updatePassword(testDbcAccountId, 'newPassword')).resolves.not.toThrow();
	});

	it('delete should remove account', async () => {
		if (!isIdmReachable) return;
		const idmId = await createAccount();
		const foundAccount = await identityManagementService.findAccountById(idmId);
		expect(foundAccount).toBeDefined();

		await accountIdmService.delete(testDbcAccountId);
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
