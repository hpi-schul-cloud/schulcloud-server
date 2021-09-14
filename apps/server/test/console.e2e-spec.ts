import { Test, TestingModule } from '@nestjs/testing';
import { INestApplicationContext } from '@nestjs/common';

import { AbstractBootstrapConsole, BootstrapConsole, ConsoleService } from 'nestjs-console';
import commander from 'commander';
import { ServerConsoleModule } from '../src/console/server-console.module';

export class TestBootstrapConsole extends AbstractBootstrapConsole<TestingModule> {
	create(): Promise<TestingModule> {
		return Test.createTestingModule({
			imports: [this.options.module],
		}).compile();
	}
}

describe('ServerConsole (e2e)', () => {
	let app: INestApplicationContext;
	let bootstrap: BootstrapConsole;
	let command: commander.Command;
	beforeEach(async () => {
		bootstrap = new TestBootstrapConsole({
			module: ServerConsoleModule,
			useDecorators: true,
		});
		app = await bootstrap.init();
		await app.init();
		command = bootstrap.getService().getRootCli();
	});

	afterEach(async () => {
		await app.close();
	});

	it('console: test', () => {
		const actionMock = jest.fn();
		command.action(actionMock);
		command.parse(['test1', 'test2', 'test3', 'test4']);
		expect(actionMock).toHaveBeenCalledWith('my-file', command.opts(), command);
	});
});
