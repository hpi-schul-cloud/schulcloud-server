import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakManagementModule } from './keycloak-management.module';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';

describe('KeycloakManagementModule', () => {
	let module: TestingModule;
	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [KeycloakManagementModule],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('KeycloakAdministrationService should be defined', () => {
		const service = module.get(KeycloakAdministrationService);
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
