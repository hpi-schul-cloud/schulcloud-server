import { INestApplicationContext } from '@nestjs/common';
import { NestApplicationContext } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AbstractBootstrapConsole, BootstrapConsole, ConsoleService } from 'nestjs-console';
import { DeletionConsoleTestModule } from './deletion-console.app.module';
import { DeletionExecutionConsole } from './deletion-execution.console';

// This is inspired by the test cases in the nestjs-console library.
// see e.g:
// - https://github.com/Pop-Code/nestjs-console/blob/master/test/bootstrap.spec.ts
// - https://github.com/Pop-Code/nestjs-console/blob/master/test/console.spec.ts

export class TestBootstrapConsole extends AbstractBootstrapConsole<TestingModule> {
	create(): Promise<TestingModule> {
		return Test.createTestingModule({
			imports: [this.options.module],
		}).compile();
	}
}

describe('DeletionExecutionConsole (e2e)', () => {
	let app: INestApplicationContext;
	let bootstrap: BootstrapConsole;
	let consoleService: ConsoleService;
	let stdoutMock: jest.Mock;
	let stderrMock: jest.Mock;
	let logMock: jest.SpyInstance;

	beforeEach(async () => {
		bootstrap = new TestBootstrapConsole({
			module: DeletionConsoleTestModule,
			useDecorators: true,
		});
		app = await bootstrap.init();
		await app.init();
		consoleService = app.get(ConsoleService);
		stdoutMock = jest.fn();
		stderrMock = jest.fn();
		logMock = jest.spyOn(console, 'log').mockImplementation();
	});

	afterEach(() => {
		stdoutMock.mockReset();
		stderrMock.mockReset();
		logMock.mockReset();
		consoleService.resetCli();
	});

	it('Should init the application context', () => {
		expect(app).toBeInstanceOf(NestApplicationContext);
		const options = bootstrap.getOptions();
		expect(options.contextOptions?.logger).toHaveLength(1);
		expect(options.contextOptions?.logger).toContain('error');
	});

	it('should execute a command with multiple args', async () => {
		const cli = consoleService.getCli('execution');
		cli?.exitOverride().configureOutput({
			writeOut: stdoutMock,
			writeErr: stderrMock,
		});

		const service = app.get(DeletionExecutionConsole);
		service.triggerDeletionExecution = service.triggerDeletionExecution.bind(service);
		const mockHandler = jest.spyOn(service, 'triggerDeletionExecution').mockImplementation();

		const args = ['trigger', '--limit', '10', '--runFailed', 'true'];

		await bootstrap.boot([process.argv0, 'deletion-console', 'execution', ...args]);

		expect(mockHandler).toHaveBeenCalledTimes(1);
		expect(mockHandler.mock.calls[0][0]).toEqual({ limit: '10', runFailed: 'true' });

		mockHandler.mockRestore();
	});
});
