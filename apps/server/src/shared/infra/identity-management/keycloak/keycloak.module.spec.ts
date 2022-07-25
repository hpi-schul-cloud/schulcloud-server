import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { KeycloakModule } from './keycloak.module';
import { KeycloakAdministrationService } from './service/keycloak-administration.service';

describe('KeycloakModule', () => {
	let module: TestingModule;
	let service: KeycloakAdministrationService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
		}).compile();
		service = module.get(KeycloakAdministrationService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined keycloak service.', () => {
		expect(service).toBeDefined();
	});
});
