import { LoggerModule } from '@core/logger';
import { TestEncryptionConfig } from '@infra/encryption';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '@infra/identity-management/keycloak-administration/keycloak-administration-config';
import {
	KEYCLOAK_CONFIGURATION_CONFIG_TOKEN,
	KeycloakConfigurationConfig,
} from '@infra/identity-management/keycloak-configuration/keycloak-configuration-config';
import { KeycloakModule } from '@infra/identity-management/keycloak/keycloak.module';
import { AccountEntity } from '@modules/account/repo';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { v1 } from 'uuid';
import { KeycloakAdministrationModule } from '../../keycloak-administration/keycloak-administration.module';
import { KeycloakAdministrationService } from '../../keycloak-administration/service/keycloak-administration.service';
import { KeycloakConfigurationModule } from '../../keycloak-configuration/keycloak-configuration.module';
import { KeycloakConfigurationService } from '../../keycloak-configuration/service/keycloak-configuration.service';
import { KeycloakIdentityManagementOauthService } from './keycloak-identity-management-oauth.service';

describe('KeycloakIdentityManagementOauthService Integration', () => {
	let module: TestingModule;
	let kcIdmOauthService: KeycloakIdentityManagementOauthService;
	let kcAdministrationService: KeycloakAdministrationService;
	let kcConfigurationService: KeycloakConfigurationService;
	let isKeycloakReachable: boolean;

	const testRealm = `test-realm-${v1()}`;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakModule.register({
					encryptionConfig: { Constructor: TestEncryptionConfig, injectionToken: 'TEST_ENCRYPTION_CONFIG_TOKEN' },
					keycloakAdministrationConfig: {
						Constructor: KeycloakAdministrationConfig,
						injectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
					},
				}),
				KeycloakConfigurationModule.register({
					encryptionConfig: { Constructor: TestEncryptionConfig, injectionToken: 'TEST_ENCRYPTION_CONFIG_TOKEN' },
					keycloakAdministrationConfig: {
						Constructor: KeycloakAdministrationConfig,
						injectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
					},
					keycloakConfigurationConfig: {
						Constructor: KeycloakConfigurationConfig,
						injectionToken: KEYCLOAK_CONFIGURATION_CONFIG_TOKEN,
					},
				}),
				KeycloakAdministrationModule.register(KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN, KeycloakAdministrationConfig),
				LoggerModule,
				MongoMemoryDatabaseModule.forRoot({ allowGlobalContext: true, entities: [AccountEntity] }),
				ConfigModule.forRoot({ isGlobal: true }),
			],
		}).compile();
		kcIdmOauthService = module.get(KeycloakIdentityManagementOauthService);
		kcAdministrationService = module.get(KeycloakAdministrationService);
		kcConfigurationService = module.get(KeycloakConfigurationService);
		isKeycloakReachable = await kcAdministrationService.testKcConnection();
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		if (isKeycloakReachable) {
			const kc = await kcAdministrationService.callKcAdminClient();
			await kc.realms.create({ realm: testRealm, enabled: true, editUsernameAllowed: true });
			kc.setConfig({ realmName: testRealm });
		}
	});

	afterEach(async () => {
		jest.clearAllMocks();
		if (isKeycloakReachable) {
			const kc = await kcAdministrationService.callKcAdminClient();
			await kc.realms.del({ realm: testRealm });
		}
	});

	describe('resourceOwnerPasswordGrant', () => {
		describe('when entering valid credentials', () => {
			const setup = async () => {
				const username = 'john.doe';
				const password = 'password';
				const kc = await kcAdministrationService.callKcAdminClient();
				await kc.users.create({
					username,
					enabled: true,
					credentials: [
						{
							type: 'password',
							value: password,
						},
					],
				});
				await kcConfigurationService.configureClient();
				jest
					.spyOn(kcAdministrationService, 'getWellKnownUrl')
					.mockImplementation(() => `${kc.baseUrl}/realms/${kc.realmName}/.well-known/openid-configuration`);
				return { username, password };
			};

			it('should return jwt', async () => {
				if (!isKeycloakReachable) return;
				const { username, password } = await setup();
				const jwt = await kcIdmOauthService.resourceOwnerPasswordGrant(username, password);
				expect(jwt).toBeDefined();
			});
		});

		describe('when entering invalid credentials', () => {
			const setup = async () => {
				const username = 'john.doe';
				const password = 'password';
				const kc = await kcAdministrationService.callKcAdminClient();
				await kc.users.create({
					username,
					enabled: true,
					credentials: [
						{
							type: 'password',
							value: password,
						},
					],
				});
				await kcConfigurationService.configureClient();
				jest
					.spyOn(kcAdministrationService, 'getWellKnownUrl')
					.mockImplementation(() => `${kc.baseUrl}/realms/${kc.realmName}/.well-known/openid-configuration`);
				return { username, password };
			};

			it('should return undefined', async () => {
				if (!isKeycloakReachable) return;
				const { username } = await setup();
				const jwt = await kcIdmOauthService.resourceOwnerPasswordGrant(username, 'other-password');
				expect(jwt).not.toBeDefined();
			});
		});
	});
});
