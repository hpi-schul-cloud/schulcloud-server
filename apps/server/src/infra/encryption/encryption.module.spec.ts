import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DefaultEncryptionService, EncryptionModule, EncryptionService } from '.';

describe('EncryptionModule', () => {
	let module: TestingModule;
	let defaultService: EncryptionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [EncryptionModule, ConfigModule.forRoot({ isGlobal: true })],
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
