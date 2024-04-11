import { INestApplicationContext } from '@nestjs/common';
import { ConsoleWriterService } from '@infra/console';
import { ServerConsoleModule } from '@src/console/console.module';
import { CommanderError } from 'commander';
import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { TestBootstrapConsole, execute } from './test-bootstrap.console';

describe('DatabaseManagementConsole (API)', () => {
	let app: INestApplicationContext;
	let bootstrap: BootstrapConsole;
	let consoleService: ConsoleService;
	let consoleWriter: ConsoleWriterService;

	beforeEach(async () => {
		bootstrap = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await bootstrap.init();
		await app.init();
		consoleService = app.get(ConsoleService);
		consoleWriter = app.get(ConsoleWriterService);
	});

	afterEach(async () => {
		consoleService.resetCli();
		await app.close();
	});

	describe('Command "database"', () => {
		const setup = () => {
			const cli = consoleService.getCli('database');
			const exitFn = (err: CommanderError) => {
				if (err.exitCode !== 0) throw err;
			};
			cli?.exitOverride(exitFn);
			const rootCli = consoleService.getRootCli();
			rootCli.exitOverride(exitFn);
			const spyConsoleWriterInfo = jest.spyOn(consoleWriter, 'info');
			const spyConsoleWriterError = jest.spyOn(consoleWriter, 'error');
			return { spyConsoleWriterInfo, spyConsoleWriterError };
		};

		describe('when command does not exist', () => {
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
				const { spyConsoleWriterInfo } = setup();

				await execute(bootstrap, ['database', 'seed']);

				expect(spyConsoleWriterInfo).toBeCalled();
			});

			it('should provide command "export"', async () => {
				const { spyConsoleWriterInfo } = setup();

				await execute(bootstrap, ['database', 'export']);

				expect(spyConsoleWriterInfo).toBeCalled();
			});

			it('should provide command "sync-indexes"', async () => {
				const { spyConsoleWriterInfo } = setup();

				await execute(bootstrap, ['database', 'sync-indexes']);

				expect(spyConsoleWriterInfo).toBeCalled();
			});

			it('should output error if command "migration" is called without flags', async () => {
				const { spyConsoleWriterError } = setup();

				await execute(bootstrap, ['database', 'migration']);

				expect(spyConsoleWriterError).toBeCalled();
			});

			it('should provide command "migration"', async () => {
				const { spyConsoleWriterInfo } = setup();

				await execute(bootstrap, ['database', 'migration', '--up']);

				expect(spyConsoleWriterInfo).toBeCalled();
			});
		});
	});
});
