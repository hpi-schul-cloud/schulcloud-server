import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseManagementService } from './database-management.service';

describe('DatabaseManagementService', () => {
	let service: DatabaseManagementService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [DatabaseManagementService],
		}).compile();

		service = module.get<DatabaseManagementService>(DatabaseManagementService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
