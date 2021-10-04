import { Test, TestingModule } from '@nestjs/testing';
import { FileSystemModule } from '@shared/infra/file-system';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { DatabaseManagementController } from './controller/database-management.controller';
import { ManagementModule } from './management.module';
import { DatabaseManagementUc } from './uc/database-management.uc';

describe('DatabaseManagementModule', () => {
	let module: TestingModule;
	let service: DatabaseManagementUc;
	let controller: DatabaseManagementController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [FileSystemModule, MongoMemoryDatabaseModule.forRoot(), ManagementModule],
		}).compile();
		service = module.get<DatabaseManagementUc>(DatabaseManagementUc);
		controller = module.get<DatabaseManagementController>(DatabaseManagementController);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined service and controller', () => {
		expect(service).toBeDefined();
		expect(controller).toBeDefined();
	});
});
