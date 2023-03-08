import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { KeycloakModule } from './keycloak.module';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';

describe('KeycloakModule', () => {
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakModule,
				MongoMemoryDatabaseModule.forRoot(),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
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
