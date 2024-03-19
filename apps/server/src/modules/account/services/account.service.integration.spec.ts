import { createMock } from '@golevelup/ts-jest';
import { MongoMemoryDatabaseModule } from '@infra/database';
import { IdentityManagementModule } from '@infra/identity-management';
import { IdentityManagementService } from '@infra/identity-management/identity-management.service';
import { KeycloakAdministrationService } from '@infra/identity-management/keycloak-administration/service/keycloak-administration.service';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client-cjs/keycloak-admin-client-cjs-index';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@shared/domain/entity';
import { IdmAccount } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { accountFactory, cleanupCollections } from '@shared/testing';
import { v1 } from 'uuid';
import { EventBus } from '@nestjs/cqrs';
import { LegacyLogger } from '../../../core/logger';
import { AccountIdmToDtoMapper, AccountIdmToDtoMapperDb } from '../mapper';
import { AccountRepo } from '../repo/account.repo';
import { AccountServiceDb } from './account-db.service';
import { AccountServiceIdm } from './account-idm.service';
import { AccountLookupService } from './account-lookup.service';
import { AccountService } from './account.service';
import { AbstractAccountService } from './account.service.abstract';
import { AccountValidationService } from './account.validation.service';
import { AccountDto, AccountSaveDto } from './dto';

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
	const testAccount = new AccountSaveDto({
		username: 'john.doe@mail.tld',
		password: 'super-secret-password',
		userId: new ObjectId().toString(),
		systemId: new ObjectId().toString(),
	});

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
				AccountLookupService,
				{
					provide: AccountIdmToDtoMapper,
					useValue: new AccountIdmToDtoMapperDb(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
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

	const compareIdmAccount = async (idmId: string, createdAccount: AccountDto): Promise<void> => {
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

	const compareDbAccount = async (dbId: string, createdAccount: AccountDto): Promise<void> => {
		const foundDbAccount = await accountRepo.findById(dbId);
		expect(foundDbAccount).toEqual(
			expect.objectContaining<Partial<Account>>({
				username: createdAccount.username,
				userId: new ObjectId(createdAccount.userId),
				systemId: new ObjectId(createdAccount.systemId),
			})
		);
	};

	it('save should create a new account', async () => {
		if (!isIdmReachable) return;
		const account = await accountService.save(testAccount);
		await compareDbAccount(account.id, account);
		await compareIdmAccount(account.idmReferenceId ?? '', account);
	});

	it('save should update existing account', async () => {
		if (!isIdmReachable) return;
		const newUsername = 'jane.doe@mail.tld';
		const [dbId, idmId] = await createAccount();
		const originalAccount = await accountService.findById(dbId);
		const updatedAccount = await accountService.save({
			...originalAccount,
			username: newUsername,
		});
		await compareDbAccount(dbId, updatedAccount);
		await compareIdmAccount(idmId, updatedAccount);
	});

	it('save should create idm account for existing db account', async () => {
		if (!isIdmReachable) return;
		const newUsername = 'jane.doe@mail.tld';
		const dbId = await createDbAccount();
		const originalAccount = await accountService.findById(dbId);
		const updatedAccount = await accountService.save({
			...originalAccount,
			username: newUsername,
		});
		await compareDbAccount(dbId, updatedAccount);
		await compareIdmAccount(updatedAccount.idmReferenceId ?? '', updatedAccount);
	});

	it('updateUsername should update username', async () => {
		if (!isIdmReachable) return;
		const newUserName = 'jane.doe@mail.tld';
		const [dbId, idmId] = await createAccount();
		await accountService.updateUsername(dbId, newUserName);

		const foundAccount = await identityManagementService.findAccountById(idmId);
		expect(foundAccount).toEqual(
			expect.objectContaining<Partial<IdmAccount>>({
				username: newUserName,
			})
		);
		const foundDbAccount = await accountRepo.findById(dbId);
		expect(foundDbAccount).toEqual(
			expect.objectContaining<Partial<Account>>({
				username: newUserName,
			})
		);
	});

	it('updatePassword should update password', async () => {
		if (!isIdmReachable) return;
		const [dbId] = await createAccount();

		const foundDbAccountBefore = await accountRepo.findById(dbId);
		const previousPasswordHash = foundDbAccountBefore.password;

		await expect(accountService.updatePassword(dbId, 'newPassword')).resolves.not.toThrow();

		const foundDbAccountAfter = await accountRepo.findById(dbId);
		expect(foundDbAccountAfter.password).not.toEqual(previousPasswordHash);
	});

	it('delete should remove account', async () => {
		if (!isIdmReachable) return;
		const [dbId, idmId] = await createAccount();
		const foundIdmAccount = await identityManagementService.findAccountById(idmId);
		expect(foundIdmAccount).toBeDefined();
		const foundDbAccount = await accountRepo.findById(dbId);
		expect(foundDbAccount).toBeDefined();

		await accountService.delete(dbId);
		await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
		await expect(accountRepo.findById(dbId)).rejects.toThrow();
	});

	it('deleteByUserId should remove account', async () => {
		if (!isIdmReachable) return;
		const [dbId, idmId] = await createAccount();
		const foundAccount = await identityManagementService.findAccountById(idmId);
		expect(foundAccount).toBeDefined();
		const foundDbAccount = await accountRepo.findById(dbId);
		expect(foundDbAccount).toBeDefined();

		await accountService.deleteByUserId(testAccount.userId ?? '');
		await expect(identityManagementService.findAccountById(idmId)).rejects.toThrow();
		await expect(accountRepo.findById(dbId)).rejects.toThrow();
	});
});
