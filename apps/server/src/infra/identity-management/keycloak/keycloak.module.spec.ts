import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { KeycloakModule } from './keycloak.module';
import { KeycloakIdentityManagementOauthService } from './service/keycloak-identity-management-oauth.service';
import { KeycloakIdentityManagementService } from './service/keycloak-identity-management.service';

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
