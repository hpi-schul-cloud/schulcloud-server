import { Test, TestingModule } from '@nestjs/testing';
import { DefaultEncryptionService, EncryptionService } from './encryption.interface';
import { EncryptionModule } from './encryption.module';
import { TestEncryptionConfig } from './testing';

describe('EncryptionModule', () => {
	let module: TestingModule;
	let defaultService: EncryptionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [EncryptionModule.register(TestEncryptionConfig, 'TEST_ENCRYPTION_CONFIG_TOKEN')],
		}).compile();
		defaultService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have the default defined service', () => {
		expect(defaultService).toBeDefined();
	});
});
