import { INestApplicationContext } from '@nestjs/common';

import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { ServerConsoleModule } from '@src/console/console.module';
import { ConsoleWriterService } from '@infra/console';
import { execute, TestBootstrapConsole } from './test-bootstrap.console';

describe('ServerConsole (API)', () => {
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

	it('should produce default output when executing "console server test"', async () => {
		await execute(bootstrap, ['server', 'test']);
		expect(logMock).toHaveBeenCalledWith('Schulcloud Server API');
	});
	it('should return input string param when executing "console server out <whatever>"', async () => {
		const sampleInputString = 'sample-input';
		await execute(bootstrap, ['server', 'out', sampleInputString]);
		expect(logMock).toHaveBeenCalledWith(`input was: ${sampleInputString}`);
	});
});
