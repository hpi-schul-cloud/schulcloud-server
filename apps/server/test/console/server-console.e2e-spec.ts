import { Test, TestingModule } from '@nestjs/testing';
import { INestApplicationContext } from '@nestjs/common';

import { AbstractBootstrapConsole, BootstrapConsole, ConsoleService } from 'nestjs-console';
import { ServerConsoleModule } from '../../src/console/console.module';
import { ConsoleWriter } from '../../src/shared/infra/console/console-writer/console-writer.service';

export class TestBootstrapConsole extends AbstractBootstrapConsole<TestingModule> {
	create(): Promise<TestingModule> {
		return Test.createTestingModule({
			imports: [this.options.module],
		}).compile();
	}
}

export const boot = async (bootstrap: BootstrapConsole, args: string[]): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const commandResponse = await bootstrap.boot([process.argv0, 'console', ...args]);
	return Promise.resolve();
};

describe('ServerConsole (e2e)', () => {
	let app: INestApplicationContext;
	let bootstrap: BootstrapConsole;
	let consoleService: ConsoleService;
	let consoleWriter: ConsoleWriter;
	let logMock: jest.SpyInstance;
	beforeEach(async () => {
		bootstrap = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await bootstrap.init();
		await app.init();
		consoleService = app.get<ConsoleService>(ConsoleService);
		consoleWriter = app.get<ConsoleWriter>(ConsoleWriter);

		logMock = jest.spyOn(consoleWriter, 'info').mockImplementation();
	});

	afterEach(async () => {
		await app.close();
		logMock.mockReset();
		consoleService.resetCli();
	});

	it('should poduce default output when executing "console server test"', async () => {
		await boot(bootstrap, ['server', 'test']);
		expect(logMock).toHaveBeenCalledWith('Schulcloud Server API');
	});
	it('should return input string param when executing "console server out <whatever>"', async () => {
		const sampleInputString = 'sample-input';
		await boot(bootstrap, ['server', 'out', sampleInputString]);
		expect(logMock).toHaveBeenCalledWith(`input was: ${sampleInputString}`);
	});
});
