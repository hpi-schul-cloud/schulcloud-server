import { Test, TestingModule } from '@nestjs/testing';

import { DatabaseManagementController } from './controller/database-management.controller';
import { ManagementModule, ManagementTestModule } from './management.module';
import { DatabaseManagementUc } from './uc/database-management.uc';

describe('ManagementModule', () => {
	let module: TestingModule;
	let service: DatabaseManagementUc;
	let controller: DatabaseManagementController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ManagementModule],
		}).compile();

		service = module.get(DatabaseManagementUc);
		controller = module.get(DatabaseManagementController);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined service and controller', () => {
		expect(service).toBeDefined();
		expect(controller).toBeDefined();
	});
});

describe('ManagementTestModule', () => {
	let module: TestingModule;
	let service: DatabaseManagementUc;
	let controller: DatabaseManagementController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ManagementTestModule],
		}).compile();

		service = module.get(DatabaseManagementUc);
		controller = module.get(DatabaseManagementController);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined service and controller', () => {
		expect(service).toBeDefined();
		expect(controller).toBeDefined();
	});
});
