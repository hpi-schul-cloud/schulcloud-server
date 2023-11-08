import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakAdministrationModule } from './keycloak-administration.module';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';

describe('KeycloakManagementModule', () => {
	let module: TestingModule;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [KeycloakAdministrationModule],
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
