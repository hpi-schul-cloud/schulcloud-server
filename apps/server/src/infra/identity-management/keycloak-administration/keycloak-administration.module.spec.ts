import { Test, TestingModule } from '@nestjs/testing';
import { KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN, KeycloakAdministrationConfig } from './keycloak-administration.config';
import { KeycloakAdministrationModule } from './keycloak-administration.module';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';

describe('KeycloakManagementModule', () => {
	let module: TestingModule;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakAdministrationModule.register(KEYCLOAK_ADMINISTRATION_CONFIG_TOKEN, KeycloakAdministrationConfig),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('KeycloakAdministrationService should be defined', () => {
		const service = module.get(KeycloakAdministrationService);
		expect(service).toBeDefined();
	});
});
