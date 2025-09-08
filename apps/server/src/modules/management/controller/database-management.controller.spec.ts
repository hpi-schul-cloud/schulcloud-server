import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { FeathersServiceProvider } from '@infra/feathers';
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
				{
					provide: FeathersServiceProvider,
					useValue: createMock<FeathersServiceProvider>(),
				},
			],
		}).compile();

		controller = module.get(DatabaseManagementController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
