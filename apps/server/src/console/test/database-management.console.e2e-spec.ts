import { INestApplicationContext } from '@nestjs/common';
import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { ServerConsoleModule } from '@src/console/console.module';
import { CommanderError } from 'commander';
import { execute, TestBootstrapConsole } from './bootstrap.console';

describe('DatabaseManagementConsole (e2e)', () => {
	let app: INestApplicationContext;
	let console: BootstrapConsole;
	let consoleService: ConsoleService;
	beforeAll(async () => {
		console = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await console.init();
		await app.init();
		consoleService = app.get(ConsoleService);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Command "database"', () => {
		beforeEach(() => {
			const cli = consoleService.getCli('database');
			const exitFn = (err: CommanderError) => {
				if (err.exitCode !== 0) throw err;
			};
			cli?.exitOverride(exitFn);
			const rootCli = consoleService.getRootCli();
			rootCli.exitOverride(exitFn);
		});

		afterEach(() => {
			consoleService.resetCli();
		});

		it('should fail for unknown command', async () => {
			await expect(execute(console, ['database', 'not_existing_command'])).rejects.toThrow(
				`error: unknown command 'not_existing_command'`
			);
		});
		it('should provide command "seed"', async () => {
			await execute(console, ['database', 'seed']);
		});
		it('should provide command "export"', async () => {
			await execute(console, ['database', 'export']);
		});
	});
});
