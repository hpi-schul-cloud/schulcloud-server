import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseManagementUc } from '../uc/database-management.uc';
import { DatabaseManagementController } from './database-management.controller';

describe('DatabaseManagementController', () => {
	let controller: DatabaseManagementController;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DatabaseManagementController],
			providers: [
				{
					provide: DatabaseManagementUc,
					useValue: {
						seedCollectionFromFile(): Promise<void> {
							return Promise.resolve();
						},
						seedAllCollectionsFromFiles(): Promise<void> {
							return Promise.resolve();
						},
						exportCollectionToFile(): Promise<void> {
							return Promise.resolve();
						},
						exportAllCollectionsToFiles(): Promise<void> {
							return Promise.resolve();
						},
					},
				},
			],
		}).compile();

		controller = module.get(DatabaseManagementController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
