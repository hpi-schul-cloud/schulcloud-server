import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseManagementController } from './database-management.controller';

describe('DatabaseManagementController', () => {
	let controller: DatabaseManagementController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DatabaseManagementController],
		}).compile();

		controller = module.get<DatabaseManagementController>(DatabaseManagementController);
	});

	it.skip('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
