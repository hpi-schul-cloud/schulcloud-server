import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '..';
import { User } from '../../../entities';
import { DatabaseManagementController } from './database-management.controller';
import { DatabaseManagementModule } from './database-management.module';
import { ManagementService } from './database-management.service';

describe('MongoConsoleModule', () => {
	describe('When enable the publish controller flag', () => {
		let module: TestingModule;
		let service: ManagementService;
		let controller: DatabaseManagementController;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [
					MongoMemoryDatabaseModule.forRoot({
						entities: [
							// sample entity used for start and test the module
							User,
						],
					}),
					DatabaseManagementModule,
				],
			}).compile();
			service = module.get<ManagementService>(ManagementService);
			controller = module.get<DatabaseManagementController>(DatabaseManagementController);
		});

		afterAll(async () => {
			await module.close();
		});

		it('should have service and controller defined', () => {
			expect(service).toBeDefined();
			expect(controller).toBeDefined();
		});
	});

	describe('When using MongoConsoleModule with default options', () => {
		let module: TestingModule;
		let service: ManagementService;
		let controller: DatabaseManagementController;

		beforeAll(async () => {
			module = await Test.createTestingModule({
				imports: [
					MongoMemoryDatabaseModule.forRoot({
						entities: [
							// sample entity used for start and test the module
							User,
						],
					}),
					DatabaseManagementModule,
				],
			}).compile();
		});

		afterAll(async () => {
			await module.close();
		});

		it('should not have service and controller to be defined', () => {
			expect(() => {
				service = module.get<ManagementService>(ManagementService);
			}).toThrow();
			expect(service).toBeUndefined();
			expect(() => {
				controller = module.get<DatabaseManagementController>(DatabaseManagementController);
			}).toThrow();
			expect(controller).toBeUndefined();
		});
	});
});
