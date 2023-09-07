import { INestApplicationContext } from '@nestjs/common';
import { ConsoleWriterService } from '@shared/infra/console';
import { ServerConsoleModule } from '@src/console/console.module';
import { CommanderError } from 'commander';
import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { TestBootstrapConsole, execute } from './test-bootstrap.console';

describe('DatabaseManagementConsole (API)', () => {
	let app: INestApplicationContext;
	let bootstrap: BootstrapConsole;
	let consoleService: ConsoleService;
	let consoleWriter: ConsoleWriterService;
	let logMock: jest.SpyInstance;
	beforeEach(async () => {
		bootstrap = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await bootstrap.init();
		await app.init();
		consoleService = app.get(ConsoleService);
		consoleWriter = app.get(ConsoleWriterService);
		logMock = jest.spyOn(consoleWriter, 'info').mockImplementation();
	});

	afterEach(async () => {
		await app.close();
		logMock.mockReset();
		consoleService.resetCli();
	});

	describe('Command "database"', () => {
		it('should fail for unknown command', async () => {
			const cli = consoleService.getCli('database');
			const exitFn = (err: CommanderError) => {
				if (err.exitCode !== 0) throw err;
			};
			cli?.exitOverride(exitFn);
			const rootCli = consoleService.getRootCli();
			rootCli.exitOverride(exitFn);

			await expect(execute(bootstrap, ['database', 'not_existing_command'])).rejects.toThrow(
				`error: unknown command 'not_existing_command'`
			);

			consoleService.resetCli();
		});

		it('should provide command "seed"', async () => {
			await execute(bootstrap, ['database', 'seed']);
		});

		it('should provide command "export"', async () => {
			await execute(bootstrap, ['database', 'export']);
		});

		it('should provide command "sync-indexes"', async () => {
			await execute(bootstrap, ['database', 'sync-indexes']);
		});
	});
});
