import { INestApplicationContext } from '@nestjs/common';
import { ServerConsoleModule } from '@src/console/console.module';
import { CommanderError } from 'commander';
import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { execute, TestBootstrapConsole } from './test-bootstrap.console';

describe.skip('IdentityManagementConsole (API)', () => {
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

	describe('Command "idm"', () => {
		beforeEach(() => {
			const cli = consoleService.getCli('idm');
			const exitFn = (err: CommanderError) => {
				if (err.exitCode !== 0) throw err;
			};
			cli?.exitOverride(exitFn);
			const rootCli = consoleService.getRootCli();
			rootCli.exitOverride(exitFn);
		});

		it('should fail for unknown command', async () => {
			await expect(execute(console, ['idm', 'not_existing_command'])).rejects.toThrow(
				"error: unknown command 'not_existing_command'"
			);
		});
		it('should provide command "check"', async () => {
			await execute(console, ['idm', 'check']);
		});
		it('should provide command "clean"', async () => {
			await execute(console, ['idm', 'clean']);
		});
		it('should provide command "seed"', async () => {
			await execute(console, ['idm', 'seed']);
		});
	});
});
