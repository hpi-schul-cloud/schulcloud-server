import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionModule, SymetricKeyEncryptionService } from '.';

describe('EncryptionModule', () => {
	let module: TestingModule;
	let service: SymetricKeyEncryptionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [EncryptionModule, ConfigModule.forRoot({ isGlobal: true })],
		}).compile();
		service = module.get(SymetricKeyEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined service', () => {
		expect(service).toBeDefined();
	});
});
