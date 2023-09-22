import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { faker } from '@faker-js/faker';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { LoggerModule } from '@src/core/logger';
import { v1 } from 'uuid';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakConfigurationModule } from '../keycloak-configuration.module';
import { KeycloakSeedService } from './keycloak-seed.service';

describe('KeycloakSeedService Integration', () => {
	let module: TestingModule;
	let keycloak: KeycloakAdminClient;
	let keycloakSeedService: KeycloakSeedService;
	let keycloakAdministrationService: KeycloakAdministrationService;
	let isKeycloakAvailable = false;
	let numberOfIdmUsers = 1009;

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

	beforeEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.create({ realm: testRealm, enabled: true });
			keycloak.setConfig({ realmName: testRealm });
			let i = 1;
			for (i = 1; i <= numberOfIdmUsers; i += 1) {
				// eslint-disable-next-line no-await-in-loop
				await createIdmUser(i);
			}
		}
	}, 60000);

	afterEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.del({ realm: testRealm });
		}
	});

	// Execute this test for a test run against a running Keycloak instance
	describe('clean', () => {
		describe('Given all users except admin user are able to delete', () => {
			it('should delete all users in the IDM', async () => {
				if (!isKeycloakAvailable) return;
				const deletedUsers = await keycloakSeedService.clean(500);
				expect(deletedUsers).toBe(numberOfIdmUsers);
			}, 60000);
		});
	});
});
