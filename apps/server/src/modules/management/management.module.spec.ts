import { Test, TestingModule } from '@nestjs/testing';
import { FileSystemModule } from '@shared/infra/file-system/file-system.module';
import { MongoMemoryDatabaseModule } from '../database';
import { User } from '../../entities';
import { DatabaseManagementController } from './controller/database-management.controller';
import { ManagementModule } from './management.module';
import { DatabaseManagementUc } from './uc/database-management.uc';

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
				ManagementModule,
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
