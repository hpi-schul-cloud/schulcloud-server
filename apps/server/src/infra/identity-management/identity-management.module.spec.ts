import { TestEncryptionConfig } from '@infra/encryption';
import { Test, TestingModule } from '@nestjs/testing';
import { IdentityManagementModule } from './identity-management.module';
import { IdentityManagementService } from './identity-management.service';
import {
	KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
	KeycloakAdministrationConfig,
} from './keycloak-administration/keycloak-administration.config';

describe('IdentityManagementModule', () => {
	let module: TestingModule;
	let idm: IdentityManagementService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				IdentityManagementModule.register({
					encryptionConfig: { Constructor: TestEncryptionConfig, injectionToken: 'TEST_ENCRYPTION_CONFIG_TOKEN' },
					keycloakAdministrationConfig: {
						Constructor: KeycloakAdministrationConfig,
						injectionToken: KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN,
					},
				}),
			],
		}).compile();
		idm = module.get(IdentityManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined identity management.', () => {
		expect(idm).toBeDefined();
	});
});
