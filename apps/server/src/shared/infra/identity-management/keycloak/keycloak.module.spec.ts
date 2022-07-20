import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { KeycloakModule } from './keycloak.module';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { KeycloakConsole } from './console/keycloak-management.console';

describe('KeycloakModule', () => {
	let module: TestingModule;
	let service: KeycloakAdministrationService;
	let console: KeycloakConsole;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
		}).compile();
		service = module.get(KeycloakAdministrationService);
		console = module.get(KeycloakConsole);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined keycloak service.', () => {
		expect(service).toBeDefined();
	});

	it('should have defined keycloak console.', () => {
		expect(console).toBeDefined();
	});
});
