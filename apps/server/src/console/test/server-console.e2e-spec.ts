import { INestApplicationContext } from '@nestjs/common';

import { BootstrapConsole, ConsoleService } from 'nestjs-console';
import { ServerConsoleModule } from '@src/console/console.module';
import { ConsoleWriterService } from '@shared/infra/console';
import { execute, TestBootstrapConsole } from './bootstrap.console';

describe('ServerConsole (e2e)', () => {
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
		consoleService = app.get<ConsoleService>(ConsoleService);
		consoleWriter = app.get<ConsoleWriterService>(ConsoleWriterService);
		logMock = jest.spyOn(consoleWriter, 'info').mockImplementation();
	});

	afterEach(async () => {
		await app.close();
		logMock.mockReset();
		consoleService.resetCli();
	});

	it('should poduce default output when executing "console server test"', async () => {
		await execute(bootstrap, ['server', 'test']);
		expect(logMock).toHaveBeenCalledWith('Schulcloud Server API');
	});
	it('should return input string param when executing "console server out <whatever>"', async () => {
		const sampleInputString = 'sample-input';
		await execute(bootstrap, ['server', 'out', sampleInputString]);
		expect(logMock).toHaveBeenCalledWith(`input was: ${sampleInputString}`);
	});
});
