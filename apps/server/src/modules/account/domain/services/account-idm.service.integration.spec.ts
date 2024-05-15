import { IdentityManagementModule, IdentityManagementService } from '@infra/identity-management';
import { KeycloakAdministrationService } from '@infra/identity-management/keycloak-administration/service/keycloak-administration.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { ObjectId } from '@mikro-orm/mongodb';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IdmAccount } from '@shared/domain/interface';
import { LoggerModule } from '@src/core/logger';
import { v1 } from 'uuid';
import { AccountIdmToDoMapper, AccountIdmToDoMapperDb } from '../../repo/micro-orm/mapper';
import { AccountServiceIdm } from './account-idm.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountSave } from '..';

describe('AccountIdmService Integration', () => {
	let module: TestingModule;
	let identityManagementService: IdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let isIdmReachable: boolean;
	let accountIdmService: AbstractAccountService;

	const testRealm = `test-realm-${v1()}`;
	const testDbcAccountId = new ObjectId().toString();
	const testAccount = {
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
		systemId: new ObjectId().toString(),
		idmReferenceId: testDbcAccountId,
	} as AccountSave;
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
				{
					provide: AccountIdmToDoMapper,
					useClass: AccountIdmToDoMapperDb,
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

	describe('save', () => {
		describe('when account does not exists', () => {
			it('should create a new account', async () => {
				if (!isIdmReachable) return;
				const createdAccount = await accountIdmService.save(testAccount);
				const foundAccount = await identityManagementService.findAccountById(createdAccount.idmReferenceId ?? '');

				expect(foundAccount).toEqual(
					expect.objectContaining<IdmAccount>({
						id: createdAccount.idmReferenceId ?? '',
						username: createdAccount.username,
						attDbcAccountId: createdAccount.id,
						attDbcUserId: createdAccount.userId,
						attDbcSystemId: createdAccount.systemId,
					})
				);
			});
		});
	});

	describe('save', () => {
		describe('when account exists', () => {
			const setup = async () => {
				const newUserName = 'jane.doe@mail.tld';
				const idmId = await createAccount();

				return { idmId, newUserName };
			};
			it('should update account', async () => {
				if (!isIdmReachable) return;
				const { idmId, newUserName } = await setup();

				await accountIdmService.save({
					id: testDbcAccountId,
					username: newUserName,
				} as AccountSave);

				const foundAccount = await identityManagementService.findAccountById(idmId);

				expect(foundAccount).toEqual(
					expect.objectContaining<IdmAccount>({
						id: idmId,
						username: newUserName,
					})
				);
			});
		});
	});

	describe('updateUsername', () => {
		describe('when updating username', () => {
			const setup = async () => {
				const newUserName = 'jane.doe@mail.tld';
				const idmId = await createAccount();

				return { newUserName, idmId };
			};
			it('should update only username', async () => {
				if (!isIdmReachable) return;
				const { newUserName, idmId } = await setup();

				await accountIdmService.updateUsername(testDbcAccountId, newUserName);
				const foundAccount = await identityManagementService.findAccountById(idmId);

				expect(foundAccount).toEqual(
					expect.objectContaining<Partial<IdmAccount>>({
						username: newUserName,
					})
				);
			});
		});
	});

	describe('updatePassword', () => {
		describe('when updating with permitted password', () => {
			const setup = async () => {
				await createAccount();
			};
			it('should update password', async () => {
				if (!isIdmReachable) return;
				await setup();
				await expect(accountIdmService.updatePassword(testDbcAccountId, 'newPassword')).resolves.not.toThrow();
			});
		});
	});

	describe('delete', () => {
		describe('when delete account', () => {
			const setup = async () => {
				const idmId = await createAccount();
				const foundAccount = await identityManagementService.findAccountById(idmId);
				return { idmId, foundAccount };
			};
			it('should remove account', async () => {
				if (!isIdmReachable) return;
				const { idmId, foundAccount } = await setup();
				expect(foundAccount).toBeDefined();

				await accountIdmService.delete(testDbcAccountId);
				await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('when deleting by UserId', () => {
			const setup = async () => {
				const idmId = await createAccount();
				const foundAccount = await identityManagementService.findAccountById(idmId);
				return { idmId, foundAccount };
			};
			it('should remove account', async () => {
				if (!isIdmReachable) return;
				const { idmId, foundAccount } = await setup();
				expect(foundAccount).toBeDefined();

				await accountIdmService.deleteByUserId(testAccount.userId ?? '');
				await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
			});
		});
	});
});
