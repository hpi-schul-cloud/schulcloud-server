import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { DatabaseManagementUc } from '../uc/database-management.uc';
import { DatabaseManagementConsole } from './database-management.console';

describe('DatabaseManagementConsole', () => {
	let service: DatabaseManagementConsole;
	let module: TestingModule;
	let consoleWriter: ConsoleWriterService;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DatabaseManagementConsole,
				{
					provide: DatabaseManagementUc,
					useValue: {
						seedDatabaseCollectionsFromFileSystem(filter: string[]) {
							if (filter === undefined) {
								return ['someCollection:1', 'otherCollection:2'];
							}
							return ['singleCollection:4'];
						},
						exportCollectionsToFileSystem(filter: string[]) {
							if (filter === undefined) {
								return ['someCollection:1', 'otherCollection:2'];
							}
							return ['singleCollection:4'];
						},
					},
				},
				{
					provide: ConsoleWriterService,
					useValue: {
						info(text: string) {},
					},
				},
			],
		}).compile();

		service = module.get<DatabaseManagementConsole>(DatabaseManagementConsole);
		consoleWriter = module.get<ConsoleWriterService>(ConsoleWriterService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('database', () => {
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
	});
});
