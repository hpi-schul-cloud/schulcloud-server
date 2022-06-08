import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakConsole } from './console/keycloak-management.console';
import { KeycloakAdministrationService } from './keycloak-administration.service';
import { KeycloakModule } from './keycloak.module';

describe('IdentityManagementModule', () => {
	let module: TestingModule;
	let service: KeycloakAdministrationService;
	let console: KeycloakConsole;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }), KeycloakModule],
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
		// {
		// 	provide: ConfigService,
		// 	useValue: createMock<ConfigService>(),
		// }
	});
});
