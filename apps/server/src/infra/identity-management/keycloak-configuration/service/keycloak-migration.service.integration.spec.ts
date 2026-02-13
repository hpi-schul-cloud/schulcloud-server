import { LoggerModule } from '@core/logger';
import { TestEncryptionConfig } from '@infra/encryption';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { accountFactory } from '@modules/account/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { v1 } from 'uuid';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '../../keycloak-administration/keycloak-administration.config';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KEYCLOAK_CONFIGURATION_CONFIG_TOKEN, KeycloakConfigurationConfig } from '../keycloak-configuration.config';
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
				KeycloakConfigurationModule.register({
					encryptionConfig: {
						configConstructor: TestEncryptionConfig,
						configInjectionToken: 'TEST_ENCRYPTION_CONFIG_TOKEN',
					},
					keycloakAdministrationConfig: {
						configConstructor: KeycloakAdministrationConfig,
						configInjectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
					},
					keycloakConfigurationConfig: {
						configConstructor: KeycloakConfigurationConfig,
						configInjectionToken: KEYCLOAK_CONFIGURATION_CONFIG_TOKEN,
					},
				}),
				LoggerModule,
				MongoMemoryDatabaseModule.forRoot({ entities: [AccountEntity] }),
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

			await em.persist(allAccounts).flush();
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
