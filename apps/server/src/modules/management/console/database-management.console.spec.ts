import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { DatabaseManagementUc } from '../uc/database-management.uc';
import { DatabaseManagementConsole } from './database-management.console';

describe('DatabaseManagementConsole', () => {
	let service: DatabaseManagementConsole;
	let module: TestingModule;
	let consoleWriter: DeepMocked<ConsoleWriterService>;
	let databaseManagementUc: DeepMocked<DatabaseManagementUc>;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DatabaseManagementConsole,
				{
					provide: DatabaseManagementUc,
					useValue: createMock<DatabaseManagementUc>(),
				},
				{
					provide: ConsoleWriterService,
					useValue: createMock<ConsoleWriterService>(),
				},
			],
		}).compile();

		service = module.get(DatabaseManagementConsole);
		consoleWriter = module.get(ConsoleWriterService);
		databaseManagementUc = module.get(DatabaseManagementUc);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('database', () => {
		beforeAll(() => {
			databaseManagementUc.seedDatabaseCollectionsFromFileSystem.mockImplementation((collections?: string[]) => {
				if (collections === undefined) {
					return Promise.resolve(['someCollection:1', 'otherCollection:2']);
				}
				return Promise.resolve(['singleCollection:4']);
			});
			databaseManagementUc.exportCollectionsToFileSystem.mockImplementation((collections?: string[]) => {
				if (collections === undefined) {
					return Promise.resolve(['someCollection:1', 'otherCollection:2']);
				}
				return Promise.resolve(['singleCollection:4']);
			});
		});

		it('should export existing collections', async () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			await service.exportCollections({});
			const result = JSON.stringify(['someCollection:1', 'otherCollection:2']);
			expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			consoleInfoSpy.mockReset();
		});
		it('should export specific collection', async () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			await service.exportCollections({ collection: 'singleCollection' });
			const result = JSON.stringify(['singleCollection:4']);
			expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			consoleInfoSpy.mockReset();
		});
		it('should pass override flag to uc', async () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			await service.exportCollections({ collection: 'singleCollection', override: true });
			const result = JSON.stringify(['singleCollection:4']);
			expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			consoleInfoSpy.mockReset();
		});
		it('should seed existing collections', async () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			await service.seedCollections({});
			const result = JSON.stringify(['someCollection:1', 'otherCollection:2']);
			expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			consoleInfoSpy.mockReset();
		});
		it('should seed specific collection', async () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			const retValue = await service.seedCollections({ collection: 'singleCollection' });
			expect(retValue).toEqual(['singleCollection:4']);
			const result = JSON.stringify(['singleCollection:4']);
			expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			consoleInfoSpy.mockReset();
		});
		it('should sync indexes', async () => {
			const consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			await service.syncIndexes();
			expect(consoleInfoSpy).toHaveBeenCalledWith('sync of indexes is completed');
			expect(databaseManagementUc.syncIndexes).toHaveBeenCalled();
			consoleInfoSpy.mockReset();
		});
	});
});
