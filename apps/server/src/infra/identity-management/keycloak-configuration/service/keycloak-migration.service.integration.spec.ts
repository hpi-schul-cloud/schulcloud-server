import { MongoMemoryDatabaseModule } from '@infra/database';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@shared/testing';
import { LoggerModule } from '@src/core/logger';
import { AccountEntity } from '@src/modules/account/domain/entity/account.entity';
import { accountFactory } from '@src/modules/account/testing';
import { v1 } from 'uuid';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakConfigurationModule } from '../keycloak-configuration.module';
import { KeycloakMigrationService } from './keycloak-migration.service';

describe('KeycloakConfigurationService Integration', () => {
	let module: TestingModule;
	let em: EntityManager;
	let keycloak: KeycloakAdminClient;
	let keycloakMigrationService: KeycloakMigrationService;
	let keycloakAdministrationService: KeycloakAdministrationService;
	let isKeycloakAvailable = false;

	let dbOnlyAccounts: AccountEntity[];
	let dbAndIdmAccounts: AccountEntity[];
	let allAccounts: AccountEntity[];

	const testRealm = `test-realm-${v1().toString()}`;

	const createAccountInIdm = async (account: AccountEntity): Promise<string> => {
		const { id } = await keycloak.users.create({
			username: account.username,
			firstName: undefined,
			lastName: undefined,
			attributes: {
				dbcAccountId: account._id,
				dbcUserId: undefined,
				dbcSystemId: account.systemId,
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
					validate: () => {
						return {
							FEATURE_IDENTITY_MANAGEMENT_STORE_ENABLED: true,
						};
					},
				}),
			],
			providers: [],
		}).compile();
		em = module.get(EntityManager);
		keycloakAdministrationService = module.get(KeycloakAdministrationService);
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
	}, 60000);

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
				const migratedAccountCounts = await keycloakMigrationService.migrate();
				expect(migratedAccountCounts).toBe(allAccounts.length);
			}, 60000);
		});
	});
});
