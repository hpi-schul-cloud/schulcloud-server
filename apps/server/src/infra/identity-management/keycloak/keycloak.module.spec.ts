import { TestEncryptionConfig } from '@infra/encryption';
import { Test, TestingModule } from '@nestjs/testing';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from '../keycloak-administration/keycloak-administration.config';
import { KeycloakModule } from './keycloak.module';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';

describe('KeycloakModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakModule.register({
					encryptionConfig: {
						configConstructor: TestEncryptionConfig,
						configInjectionToken: 'TEST_ENCRYPTION_CONFIG_TOKEN',
					},
					keycloakAdministrationConfig: {
						configConstructor: KeycloakAdministrationConfig,
						configInjectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
					},
				}),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined keycloak identity management service.', () => {
		const service = module.get(KeycloakIdentityManagementService);
		expect(service).toBeDefined();
	});

	it('should have defined keycloak identity management oauth service.', () => {
		const service = module.get(KeycloakIdentityManagementOauthService);
		expect(service).toBeDefined();
	});
});
