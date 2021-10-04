import { INestApplicationContext } from '@nestjs/common';
import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { ServerConsoleModule } from '@src/console/console.module';
import { DatabaseManagementUc } from '@src/modules/management/uc/database-management.uc';
import { execute, TestBootstrapConsole } from './bootstrap.console';
import { ConsoleWriter } from '../console-writer';

describe('ServerConsole (e2e)', () => {
	let app: INestApplicationContext;
	let console: BootstrapConsole;
	let consoleService: ConsoleService;
	let uc: DatabaseManagementUc;
	let consoleWriter: ConsoleWriter;
	beforeAll(async () => {
		console = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await console.init();
		await app.init();
		consoleService = app.get<ConsoleService>(ConsoleService);
		consoleWriter = app.get<ConsoleWriter>(ConsoleWriter);
		uc = app.get<DatabaseManagementUc>(DatabaseManagementUc);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Command "database"', () => {
		let logMock: jest.SpyInstance;

		beforeEach(() => {
			// const cli = consoleService.getCli('database');
			// cli?.exitOverride((err: CommanderError) => {
			// 	if (err.exitCode !== 0) throw err;
			// });
			logMock = jest.spyOn(consoleWriter, 'info').mockImplementation();
		});

		afterEach(() => {
			logMock.mockReset();
			consoleService.resetCli();
		});
		it('should provide command "seed"', async () => {
			const seedDatabaseCollectionsFromFileSystemMock = jest.spyOn(uc, 'seedDatabaseCollectionsFromFileSystem');
			await execute(console, ['database', 'seed']);
			expect(seedDatabaseCollectionsFromFileSystemMock).toBeCalled();
			seedDatabaseCollectionsFromFileSystemMock.mockReset();
		});
		it('should provide command "export"', async () => {
			const exportCollectionsToFileSystemMock = jest.spyOn(uc, 'exportCollectionsToFileSystem');
			await execute(console, ['database', 'export']);
			expect(exportCollectionsToFileSystemMock).toBeCalled();
			exportCollectionsToFileSystemMock.mockReset();
		});
	});
});
