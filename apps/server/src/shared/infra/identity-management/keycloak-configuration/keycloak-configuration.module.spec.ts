import { Test, TestingModule } from '@nestjs/testing';

import { ConfigModule } from '@nestjs/config';
import { MongoMemoryDatabaseModule } from '@shared/infra/database/mongo-memory-database/mongo-memory-database.module';
import { KeycloakConsole } from './console/keycloak-configuration.console';
import { KeycloakConfigurationModule } from './keycloak-configuration.module';
import { KeycloakConfigurationService } from './service/keycloak-configuration.service';
import { KeycloakSeedService } from './service/keycloak-seed.service';

describe('KeycloakManagementModule', () => {
	let module: TestingModule;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakConfigurationModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
			],
		}).compile();
	});

	afterAll(async () => {
		await module.close();
	});

	it('KeycloakAdministrationService should be defined', () => {
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
