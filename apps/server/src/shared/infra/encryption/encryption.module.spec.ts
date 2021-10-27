import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionModule, SymetricKeyEncryptionService } from '.';

describe('EncryptionModule', () => {
	let module: TestingModule;
	let service: SymetricKeyEncryptionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [EncryptionModule.forRoot({ SymmetricCipherKey: 'sampleEncryptionKey' })],
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
