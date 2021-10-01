import { INestApplicationContext } from '@nestjs/common';
import { CommanderError } from 'commander';
import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { ServerConsoleModule } from '../../src/console/console.module';
import { DatabaseManagementUc } from '../../src/modules/management/uc/database-management.uc';
import { execute, TestBootstrapConsole } from './bootstrap.console';

describe('ServerConsole (e2e)', () => {
	let app: INestApplicationContext;
	let console: BootstrapConsole;
	let consoleService: ConsoleService;
	let uc: DatabaseManagementUc;
	beforeAll(async () => {
		console = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await console.init();
		await app.init();
		consoleService = app.get<ConsoleService>(ConsoleService);
		uc = app.get<DatabaseManagementUc>(DatabaseManagementUc);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Command "database"', () => {
		let exportCollectionsToFileSystemMock: jest.SpyInstance;
		let seedDatabaseCollectionsFromFileSystemMock: jest.SpyInstance;

		beforeEach(() => {
			const cli = consoleService.getCli('database');
			cli?.exitOverride((err: CommanderError) => {
				if (err.exitCode !== 0) throw err;
			});
			exportCollectionsToFileSystemMock = jest.spyOn(uc, 'exportCollectionsToFileSystem');
			seedDatabaseCollectionsFromFileSystemMock = jest.spyOn(uc, 'seedDatabaseCollectionsFromFileSystem');
		});

		afterEach(() => {
			exportCollectionsToFileSystemMock.mockReset();
			seedDatabaseCollectionsFromFileSystemMock.mockReset();
			consoleService.resetCli();
		});
		it('should provide command "seed"', async () => {
			await execute(console, ['database', 'seed']);
			expect(seedDatabaseCollectionsFromFileSystemMock).toBeCalled();
		});
	});
});
