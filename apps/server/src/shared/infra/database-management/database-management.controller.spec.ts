import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseManagementController } from './database-management.controller';
import { DatabaseManagementUc } from './database-management.uc';

describe('DatabaseManagementController', () => {
	let controller: DatabaseManagementController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DatabaseManagementController],
			providers: [
				{
					provide: DatabaseManagementUc,
					useValue: {
						seedCollectionFromFile(collectionName: string): Promise<void> {
							return Promise.resolve();
						},
						seedAllCollectionsFromFiles(): Promise<void> {
							return Promise.resolve();
						},
						exportCollectionToFile(collectionName: string): Promise<void> {
							return Promise.resolve();
						},
						exportAllCollectionsToFiles(): Promise<void> {
							return Promise.resolve();
						},
					},
				},
			],
		}).compile();

		controller = module.get<DatabaseManagementController>(DatabaseManagementController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
