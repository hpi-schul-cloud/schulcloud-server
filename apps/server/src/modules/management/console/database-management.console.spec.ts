import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@infra/console';
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
		let consoleInfoSpy: jest.SpyInstance;
		let consoleErrorSpy: jest.SpyInstance;
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

		beforeEach(() => {
			consoleInfoSpy = jest.spyOn(consoleWriter, 'info');
			consoleErrorSpy = jest.spyOn(consoleWriter, 'error');
		});
		afterEach(() => {
			jest.clearAllMocks();
		});

		describe('when exporting collections', () => {
			it('should export existing collections', async () => {
				await service.exportCollections({});
				const result = JSON.stringify(['someCollection:1', 'otherCollection:2']);
				expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			});
			it('should export specific collection', async () => {
				await service.exportCollections({ collection: 'singleCollection' });
				const result = JSON.stringify(['singleCollection:4']);
				expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			});
			it('should pass override flag to uc', async () => {
				await service.exportCollections({ collection: 'singleCollection', override: true });
				const result = JSON.stringify(['singleCollection:4']);
				expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			});
		});
		describe('When seeding collections', () => {
			it('should seed existing collections', async () => {
				await service.seedCollections({});
				const result = JSON.stringify(['someCollection:1', 'otherCollection:2']);
				expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			});
			it('should seed specific collection', async () => {
				const retValue = await service.seedCollections({ collection: 'singleCollection' });
				expect(retValue).toEqual(['singleCollection:4']);
				const result = JSON.stringify(['singleCollection:4']);
				expect(consoleInfoSpy).toHaveBeenCalledWith(result);
			});
		});
		it('should sync indexes', async () => {
			await service.syncIndexes();
			expect(consoleInfoSpy).toHaveBeenCalledWith('sync of indexes is completed');
			expect(databaseManagementUc.syncIndexes).toHaveBeenCalled();
		});
		describe('When calling migration', () => {
			it('should migrate up', async () => {
				await service.migration({ up: true });
				expect(consoleInfoSpy).toHaveBeenCalledWith('migration up is completed');
				expect(databaseManagementUc.migrationUp).toHaveBeenCalled();
			});
			it('should migrate down', async () => {
				await service.migration({ down: true });
				expect(consoleInfoSpy).toHaveBeenCalledWith('migration down is completed');
				expect(databaseManagementUc.migrationDown).toHaveBeenCalled();
			});
			it('should check pending migrations', async () => {
				await service.migration({ pending: true });
				expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('Pending:'));
				expect(databaseManagementUc.migrationPending).toHaveBeenCalled();
			});
			it('should no migrate if no param specified', async () => {
				await service.migration({});
				expect(consoleErrorSpy).toHaveBeenCalledWith('no migration option was given');
				expect(databaseManagementUc.migrationUp).not.toHaveBeenCalled();
				expect(databaseManagementUc.migrationDown).not.toHaveBeenCalled();
			});
		});
	});
});
