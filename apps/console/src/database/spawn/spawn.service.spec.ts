import { Test, TestingModule } from '@nestjs/testing';
import { SpawnService } from './spawn.service';

describe('SpawnService', () => {
	let service: SpawnService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SpawnService],
		}).compile();

		service = module.get<SpawnService>(SpawnService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
