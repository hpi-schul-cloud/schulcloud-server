import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '../../../../modules/database';
import { DatabaseManagementModule } from './database-management.module';
import { DatabaseManagementService } from './database-management.service';

describe('DatabaseManagementModule', () => {
	let module: TestingModule;
	let service: DatabaseManagementService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [DatabaseManagementModule, MongoMemoryDatabaseModule.forRoot()],
		}).compile();
		service = module.get<DatabaseManagementService>(DatabaseManagementService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should have defined service', () => {
		expect(service).toBeDefined();
	});
});
