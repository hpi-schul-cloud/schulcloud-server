import { EntityManager } from '@mikro-orm/mongodb';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Account } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { accountFactory, cleanupCollections } from '@shared/testing';
import { LoggerModule } from '@src/core/logger';
import { v1 } from 'uuid';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakConfigurationModule } from '../keycloak-configuration.module';
import { KeycloakMigrationService } from './keycloak-migration.service';
import { IdentityManagementService } from '../../identity-management.service';

describe('KeycloakConfigurationService Integration', () => {
	jest.setTimeout(60000);

	let module: TestingModule;
	let em: EntityManager;
	let keycloak: KeycloakAdminClient;
	let keycloakMigrationService: KeycloakMigrationService;
	let keycloakAdministrationService: KeycloakAdministrationService;
	let identityManagementService: IdentityManagementService;
	let isKeycloakAvailable = false;

	let dbOnlyAccounts: Account[];
	let dbAndIdmAccounts: Account[];
	let allAccounts: Account[];

	const testRealm = `test-realm-${v1().toString()}`;

	const createAccountInIdm = async (account: Account): Promise<string> => {
		const { id } = await keycloak.users.create({
			username: account.username,
			firstName: undefined,
			lastName: undefined,
			attributes: {
				refTechnicalId: account._id,
				refFunctionalIntId: undefined,
				refFunctionalExtId: account.systemId,
			},
		});
		await keycloak.users.resetPassword({
			id,
			credential: {
				temporary: false,
				type: 'password',
				value: account.password ?? 'DummyPwd1!',
			},
		});
		return id;
	};

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakConfigurationModule,
				LoggerModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({
					isGlobal: true,
					ignoreEnvFile: true,
					ignoreEnvVars: true,
					load: [
						() => {
							return {
								FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: true,
							};
						},
					],
				}),
			],
			providers: [],
		}).compile();
		em = module.get(EntityManager);
		keycloakAdministrationService = module.get(KeycloakAdministrationService);
		identityManagementService = module.get(IdentityManagementService);
		isKeycloakAvailable = await keycloakAdministrationService.testKcConnection();
		if (isKeycloakAvailable) {
			keycloak = await keycloakAdministrationService.callKcAdminClient();
		}
		keycloakMigrationService = module.get(KeycloakMigrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.create({ realm: testRealm, enabled: true });
			keycloak.setConfig({ realmName: testRealm });
			dbOnlyAccounts = accountFactory.buildList(2);
			dbAndIdmAccounts = accountFactory.buildList(123);
			allAccounts = [...dbOnlyAccounts, ...dbAndIdmAccounts];

			await em.persistAndFlush(allAccounts);
			for (const account of dbAndIdmAccounts) {
				// eslint-disable-next-line no-await-in-loop
				await createAccountInIdm(account);
			}
		}
	});

	afterEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.del({ realm: testRealm });
		}
		await cleanupCollections(em);
	});

	// Execute this test for a test run against a running Keycloak instance
	describe('migration', () => {
		describe('Given all accounts are able to migrate', () => {
			it('should copy all accounts to the IDM', async () => {
				if (!isKeycloakAvailable) return;
				const createSpy = jest.spyOn(identityManagementService, 'createAccount');
				const updateSpy = jest.spyOn(identityManagementService, 'updateAccount');
				const migratedAccountCounts = await keycloakMigrationService.migrate();
				expect(migratedAccountCounts).toBe(allAccounts.length);
				expect(createSpy).toHaveBeenCalledTimes(dbOnlyAccounts.length);
				expect(updateSpy).toHaveBeenCalledTimes(dbAndIdmAccounts.length);
			});
		});
		describe('Given there is an account that can not be migrated', () => {
			it('should report failures', async () => {
				if (!isKeycloakAvailable) return;

				// GIVEN
				const conflictingIdmAccount = accountFactory.build();
				const conflictingDbAccount = dbOnlyAccounts[0];
				conflictingIdmAccount.username = conflictingDbAccount.username;
				await createAccountInIdm(conflictingIdmAccount);

				const migratedAccountCounts = await keycloakMigrationService.migrate();
				expect(migratedAccountCounts).toBe(allAccounts.length - 1);
			});
		});
	});
});
