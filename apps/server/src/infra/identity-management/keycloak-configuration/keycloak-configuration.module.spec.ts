import { TestEncryptionConfig } from '@infra/encryption';
import { SystemEntity } from '@modules/system/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '../keycloak-administration/keycloak-administration.config';
import { KeycloakConsole } from './console/keycloak-configuration.console';
import { KEYCLOAK_CONFIGURATION_CONFIG_TOKEN, KeycloakConfigurationConfig } from './keycloak-configuration.config';
import { KeycloakConfigurationModule } from './keycloak-configuration.module';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';

describe('KeycloakConfigurationModule', () => {
	let module: TestingModule;
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
				MongoMemoryDatabaseModule.forRoot({ entities: [SystemEntity] }),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('KeycloakConsole should be defined', () => {
		const service = module.get(KeycloakConsole);
		expect(service).toBeDefined();
	});

	it('KeycloakConfigurationService should be defined', () => {
		const service = module.get(KeycloakConfigurationService);
		expect(service).toBeDefined();
	});

	it('KeycloakSeedService should be defined', () => {
		const service = module.get(KeycloakSeedService);
		expect(service).toBeDefined();
	});
});
