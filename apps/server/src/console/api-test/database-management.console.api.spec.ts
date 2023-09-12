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
		logMock.mockReset();
		consoleService.resetCli();
		await app.close();
	});

	describe('Command "database"', () => {
		describe('when command not exists', () => {
			const setup = () => {
				const cli = consoleService.getCli('database');
				const exitFn = (err: CommanderError) => {
					if (err.exitCode !== 0) throw err;
				};
				cli?.exitOverride(exitFn);
				const rootCli = consoleService.getRootCli();
				rootCli.exitOverride(exitFn);
			};

			it('should fail for unknown command', async () => {
				setup();
				await expect(execute(bootstrap, ['database', 'not_existing_command'])).rejects.toThrow(
					`error: unknown command 'not_existing_command'`
				);

				consoleService.resetCli();
			});
		});

		describe('when command exists', () => {
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
});
