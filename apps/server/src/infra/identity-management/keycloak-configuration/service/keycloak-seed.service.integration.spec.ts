import { LoggerModule } from '@core/logger';
import { faker } from '@faker-js/faker';
import { TestEncryptionConfig } from '@infra/encryption';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { AccountEntity } from '@modules/account/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { v1 } from 'uuid';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '../../keycloak-administration/keycloak-administration.config';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KEYCLOAK_CONFIGURATION_CONFIG_TOKEN, KeycloakConfigurationConfig } from '../keycloak-configuration.config';
import { KeycloakConfigurationModule } from '../keycloak-configuration.module';
import { KeycloakSeedService } from './keycloak-seed.service';

describe('KeycloakSeedService Integration', () => {
	let module: TestingModule;
	let keycloak: KeycloakAdminClient;
	let keycloakSeedService: KeycloakSeedService;
	let keycloakAdministrationService: KeycloakAdministrationService;
	let isKeycloakAvailable = false;
	const numberOfIdmUsers = 1009;

	const testRealm = `test-realm-${v1().toString()}`;

	const createIdmUser = async (index: number): Promise<void> => {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		await keycloak.users.create({
			username: `${index}.${lastName}@sp-sh.de`,
			firstName,
			lastName,
			email: `${index}.${lastName}@sp-sh.de`,
		});
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
		keycloakAdministrationService = module.get(KeycloakAdministrationService);
		isKeycloakAvailable = await keycloakAdministrationService.testKcConnection();
		if (isKeycloakAvailable) {
			keycloak = await keycloakAdministrationService.callKcAdminClient();
		}
		keycloakSeedService = module.get(KeycloakSeedService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.del({ realm: testRealm });
		}
	});

	// Execute this test for a test run against a running Keycloak instance
	describe('clean', () => {
		describe('Given all users are able to delete', () => {
			const setup = async () => {
				await keycloak.realms.create({ realm: testRealm, enabled: true });
				keycloak.setConfig({ realmName: testRealm });
				let i = 1;
				for (i = 1; i <= numberOfIdmUsers; i += 1) {
					// eslint-disable-next-line no-await-in-loop
					await createIdmUser(i);
				}
			};

			it('should delete all users in the IDM', async () => {
				if (!isKeycloakAvailable) return;
				await setup();
				const deletedUsers = await keycloakSeedService.clean(500);
				expect(deletedUsers).toBe(numberOfIdmUsers);
			}, 60000);
		});
	});
});
