import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../../modules/database';
import { User } from '../../../entities';
import { FileSystemModule } from '../file-system/file-system.module';
import { DatabaseManagementController } from './database-management.controller';
import { DatabaseManagementModule } from './database-management.module';
import { DatabaseManagementUc } from './database-management.uc';

describe('DatabaseManagementModule', () => {
	let module: TestingModule;
	let service: DatabaseManagementUc;
	let controller: DatabaseManagementController;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				FileSystemModule,
				MongoMemoryDatabaseModule.forRoot({
					entities: [
						// sample entity used for start and test the module
						User,
					],
				}),
				DatabaseManagementModule,
			],
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
