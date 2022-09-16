import { Test, TestingModule } from '@nestjs/testing';
import { HydraService } from '@shared/infra/oauth-provider/hydra/hydra.service';

describe('HydraService', () => {
	let module: TestingModule;
	let service: HydraService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [HydraService],
		}).compile();

		service = module.get(HydraService);
	});

	afterAll(async () => {
		await module.close();
	});

	// TODO remove after implementation
	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
