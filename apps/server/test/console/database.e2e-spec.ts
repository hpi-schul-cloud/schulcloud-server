import { INestApplicationContext } from '@nestjs/common';
import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { ServerConsoleModule } from '../../src/console/console.module';
import { ConsoleWriterService } from '../../src/shared/infra/console/console-writer/console-writer.service';
import { execute, TestBootstrapConsole } from './bootstrap.console';

describe('ServerConsole (e2e)', () => {
	let app: INestApplicationContext;
	let console: BootstrapConsole;
	let consoleService: ConsoleService;
	let consoleWriter: ConsoleWriterService;
	let logMock: jest.SpyInstance;
	beforeAll(async () => {
		console = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await console.init();
		await app.init();
		consoleService = app.get<ConsoleService>(ConsoleService);
		consoleWriter = app.get<ConsoleWriterService>(ConsoleWriterService);
	});

	beforeEach(() => {
		// .exitOverride(function ignoreExitCode0(err: CommanderError) {
		// 	if (err.exitCode !== 0) throw err;
		// });
		consoleService
			.getRootCli()
			.exitOverride()
			.configureOutput({
				writeOut: (text: string) => consoleWriter.info(text),
				writeErr: (text: string) => consoleWriter.info(text),
			});
		logMock = jest.spyOn(consoleWriter, 'info').mockImplementation();
	});

	afterEach(() => {
		logMock.mockReset();
		consoleService.resetCli();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Command "database"', () => {
		it('should display database and help', async () => {
			await execute(console, ['database', '--help']);
		});
		// TODO remove help and execute when using in memory db, add log mock
		it('should offer "seed" and help', async () => {
			await execute(console, ['database', 'seed', '--help']);
		});
		it('should offer "export" and help', async () => {
			await execute(console, ['database', 'export', '--help']);
		});
	});
});
