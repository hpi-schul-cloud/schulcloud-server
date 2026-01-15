import { TestEncryptionConfig } from '@infra/encryption';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { IdentityManagementModule } from './identity-management.module';
import { IdentityManagementService } from './identity-management.service';

describe('IdentityManagementModule', () => {
	let module: TestingModule;
	let idm: IdentityManagementService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				IdentityManagementModule.register(TestEncryptionConfig, 'TEST_ENCRYPTION_CONFIG_TOKEN'),
				ConfigModule.forRoot({ ignoreEnvFile: true, ignoreEnvVars: true, isGlobal: true }),
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
