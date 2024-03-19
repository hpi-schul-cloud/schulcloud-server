/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { IdentityManagementModule } from '@infra/identity-management';
import { IdentityManagementService } from '@infra/identity-management/identity-management.service';
import { KeycloakAdministrationService } from '@infra/identity-management/keycloak-administration/service/keycloak-administration.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IdmAccount } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { accountFactory, cleanupCollections } from '@shared/testing';
import { v1 } from 'uuid';
import { LegacyLogger } from '../../../core/logger';
import { AccountIdmToDoMapper, AccountIdmToDoMapperDb } from '../repo/mapper';
import { AccountRepo } from '../repo/account.repo';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AccountService } from './account.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';
import { Account, AccountSave } from '../domain';
import { AccountEntity } from '../entity/account.entity';

describe('AccountService Integration', () => {
	let module: TestingModule;
	let identityManagementService: IdentityManagementService;
	let keycloakAdminService: KeycloakAdministrationService;
	let keycloak: KeycloakAdminClient;
	let accountService: AbstractAccountService;
	let accountRepo: AccountRepo;
	let em: EntityManager;
	let isIdmReachable = true;

	const testRealm = `test-realm-${v1()}`;
	const testAccount = {
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
		systemId: new ObjectId().toString(),
	} as AccountSave;

	const createDbAccount = async (): Promise<string> => {
		const accountEntity = accountFactory.build({
			username: testAccount.username,
			userId: testAccount.userId,
			systemId: testAccount.systemId,
		});
		await em.persistAndFlush(accountEntity);
		return accountEntity.id;
	};

	const createIdmAccount = async (refId: string): Promise<string> => {
		const idmId = await identityManagementService.createAccount(
			{
				username: testAccount.username,
				attDbcUserId: testAccount.userId,
				attDbcSystemId: testAccount.systemId,
				attDbcAccountId: refId,
			},
			testAccount.password
		);
		return idmId;
	};

	const createAccount = async (): Promise<[string, string]> => {
		const dbId = await createDbAccount();
		const idmId = await createIdmAccount(dbId);
		return [dbId, idmId];
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				IdentityManagementModule,
				MongoMemoryDatabaseModule.forRoot(),
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
			],
			providers: [
				AccountService,
				AccountServiceIdm,
				AccountServiceDb,
				AccountRepo,
				UserRepo,
				AccountValidationService,
				{
					provide: AccountIdmToDoMapper,
					useValue: new AccountIdmToDoMapperDb(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();
		accountService = module.get(AccountService);
		identityManagementService = module.get(IdentityManagementService);
		accountRepo = module.get(AccountRepo);
		em = module.get(EntityManager);
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
		await cleanupCollections(em);
	});

	const compareIdmAccount = async (idmId: string, createdAccount: Account): Promise<void> => {
		const foundAccount = await identityManagementService.findAccountById(idmId);
		expect(foundAccount).toEqual(
			expect.objectContaining<IdmAccount>({
				id: createdAccount.idmReferenceId ?? '',
				username: createdAccount.username,
				attDbcAccountId: createdAccount.id,
				attDbcUserId: createdAccount.userId,
				attDbcSystemId: createdAccount.systemId,
			})
		);
	};

	const compareDbAccount = async (dbId: string, createdAccount: Account): Promise<void> => {
		const foundDbAccount = await accountRepo.findById(dbId);
		expect(foundDbAccount).toEqual(
			expect.objectContaining<Partial<AccountEntity>>({
				username: createdAccount.username,
				userId: new ObjectId(createdAccount.userId),
				systemId: new ObjectId(createdAccount.systemId),
			})
		);
	};

	describe('save', () => {
		describe('when account not exists', () => {
			it('should create a new account', async () => {
				if (!isIdmReachable) return;
				const account = await accountService.save(testAccount);
				await compareDbAccount(account.id, account);
				await compareIdmAccount(account.idmReferenceId ?? '', account);
			});
		});

		describe('when account exists', () => {
			const setup = async () => {
				const newUsername = 'jane.doe@mail.tld';
				const [dbId, idmId] = await createAccount();
				const originalAccount = await accountService.findById(dbId);
				return { newUsername, dbId, idmId, originalAccount };
			};
			it('save should update existing account', async () => {
				if (!isIdmReachable) return;
				const { newUsername, dbId, idmId, originalAccount } = await setup();
				const updatedAccount = await accountService.save({
					...originalAccount.getProps(),
					username: newUsername,
				} as AccountSave);
				await compareDbAccount(dbId, updatedAccount);
				await compareIdmAccount(idmId, updatedAccount);
			});
		});

		describe('when only db account exists', () => {
			const setup = async () => {
				const newUsername = 'jane.doe@mail.tld';
				const dbId = await createDbAccount();
				const originalAccount = await accountService.findById(dbId);
				return { newUsername, dbId, originalAccount };
			};
			it('should create idm account for existing db account', async () => {
				if (!isIdmReachable) return;
				const { newUsername, dbId, originalAccount } = await setup();

				const updatedAccount = await accountService.save({
					...originalAccount.getProps(),
					username: newUsername,
				} as AccountSave);
				await compareDbAccount(dbId, updatedAccount);
				await compareIdmAccount(updatedAccount.idmReferenceId ?? '', updatedAccount);
			});
		});
	});

	describe('updateUsername', () => {
		describe('when updating Username', () => {
			const setup = async () => {
				const newUsername = 'jane.doe@mail.tld';
				const [dbId, idmId] = await createAccount();

				return { newUsername, dbId, idmId };
			};
			it('should update username', async () => {
				if (!isIdmReachable) return;
				const { newUsername, dbId, idmId } = await setup();

				await accountService.updateUsername(dbId, newUsername);
				const foundAccount = await identityManagementService.findAccountById(idmId);
				const foundDbAccount = await accountRepo.findById(dbId);

				expect(foundAccount).toEqual(
					expect.objectContaining<Partial<IdmAccount>>({
						username: newUsername,
					})
				);
				expect(foundDbAccount).toEqual(
					expect.objectContaining<Partial<AccountEntity>>({
						username: newUsername,
					})
				);
			});
		});
	});

	describe('updatePassword', () => {
		describe('when updating password', () => {
			const setup = async () => {
				const [dbId] = await createAccount();

				const foundDbAccountBefore = await accountRepo.findById(dbId);
				const previousPasswordHash = foundDbAccountBefore.password;
				const foundDbAccountAfter = await accountRepo.findById(dbId);

				return { dbId, previousPasswordHash, foundDbAccountAfter };
			};
			it('should update password', async () => {
				if (!isIdmReachable) return;
				const { dbId, previousPasswordHash, foundDbAccountAfter } = await setup();

				await expect(accountService.updatePassword(dbId, 'newPassword')).resolves.not.toThrow();

				expect(foundDbAccountAfter.password).not.toEqual(previousPasswordHash);
			});
		});
	});

	describe('delete', () => {
		describe('when delete an account', () => {
			const setup = async () => {
				const [dbId, idmId] = await createAccount();
				const foundIdmAccount = await identityManagementService.findAccountById(idmId);
				const foundDbAccount = await accountRepo.findById(dbId);

				return { dbId, idmId, foundIdmAccount, foundDbAccount };
			};
			it('should remove account', async () => {
				if (!isIdmReachable) return;
				const { dbId, idmId, foundIdmAccount, foundDbAccount } = await setup();

				expect(foundIdmAccount).toBeDefined();
				expect(foundDbAccount).toBeDefined();

				await accountService.delete(dbId);
				await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
				await expect(accountRepo.findById(dbId)).rejects.toThrow();
			});
		});
	});

	describe('deleteByUserId', () => {
		describe('when delete an account by User Id', () => {
			const setup = async () => {
				const [dbId, idmId] = await createAccount();
				const foundIdmAccount = await identityManagementService.findAccountById(idmId);
				const foundDbAccount = await accountRepo.findById(dbId);

				return { dbId, idmId, foundIdmAccount, foundDbAccount };
			};
			it('should remove account', async () => {
				if (!isIdmReachable) return;
				const { dbId, idmId, foundIdmAccount, foundDbAccount } = await setup();

				expect(foundIdmAccount).toBeDefined();
				expect(foundDbAccount).toBeDefined();

				await accountService.deleteByUserId(testAccount.userId ?? '');
				await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
				await expect(accountRepo.findById(dbId)).rejects.toThrow();
			});
		});
	});
});
