import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { faker } from '@faker-js/faker';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { LegacyLogger, LoggerModule } from '@src/core/logger';
import { v1 } from 'uuid';
import UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakConfigurationModule } from '../keycloak-configuration.module';
import { KeycloakSeedService } from './keycloak-seed.service';

describe('KeycloakSeedService Integration', () => {
	let module: TestingModule;
	let logger: LegacyLogger;
	let keycloak: KeycloakAdminClient;
	let keycloakSeedService: KeycloakSeedService;
	let keycloakAdministrationService: KeycloakAdministrationService;
	let isKeycloakAvailable = false;
	const numberOfIdmUsers = 100_000;

	const testRealm = `test-realm-${v1().toString()}`;

	const createIdmAdminUserObject = (realm: string): UserRepresentation => {
		const user = {
			realm,
			username: 'keycloak',
			firstName: undefined,
			lastName: undefined,
			enabled: true,
		};
		return user;
	};

	const createIdmUserObject = (index: number, realm: string): UserRepresentation => {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const user = {
			realm,
			username: `${index}.${lastName}@sp-sh.de`,
			firstName,
			lastName,
			email: `${index}.${lastName}@sp-sh.de`,
		};
		return user;
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
	}, 30 * 60 * 1000);

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.create({ realm: testRealm, enabled: true });
			const { id } = await keycloak.users.create(createIdmAdminUserObject(testRealm));
			keycloak.setConfig({ realmName: testRealm });
			const client = (await keycloak.clients.find()).find(
				(clients) => clients.clientId === 'realm-management'
			) as ClientRepresentation;
			const roles = await keycloak.clients.listRoles({
				id: client.id as string,
			});
			const realmAdmin = roles.find((role) => role.name === 'realm-admin');
			await keycloak.users.addClientRoleMappings({
				id,
				clientUniqueId: client.id as string,
				roles: [
					{
						id: realmAdmin?.id as string,
						name: realmAdmin?.name as string,
					},
				],
			});
			await keycloak.users.resetPassword({
				id,
				credential: {
					temporary: false,
					type: 'password',
					value: 'keycloak',
				},
			});

			for (let i = 0; i < numberOfIdmUsers; i += 1) {
				try {
					if (i % 5000 === 0) {
						// eslint-disable-next-line no-await-in-loop
						await keycloakAdministrationService.testKcConnection();
					}
					// eslint-disable-next-line no-await-in-loop
					await keycloak.users.create(createIdmUserObject(i, testRealm));
				} catch (err) {
					logger.log(err);
				}
			}
		}
	}, 30 * 60 * 1000);

	afterEach(async () => {
		if (isKeycloakAvailable) {
			await keycloak.realms.del({ realm: testRealm });
		}
	}, 30 * 60 * 1000);

	// Execute this test for a test run against a running Keycloak instance
	describe('clean', () => {
		describe('Given all users are able to delete', () => {
			it(
				'should delete all users in the IDM',
				async () => {
					if (!isKeycloakAvailable) return;
					const deletedUsers = await keycloakSeedService.clean(1000);
					expect(deletedUsers).toBe(numberOfIdmUsers);
				},
				30 * 60 * 1000
			);
		});
	});
});
