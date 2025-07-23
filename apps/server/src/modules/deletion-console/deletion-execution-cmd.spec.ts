import { INestApplicationContext } from '@nestjs/common';
import { NestApplicationContext } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AbstractBootstrapConsole, CommonBootstrapConsoleOptions } from 'nestjs-console';
import { CommandResponse } from 'nestjs-console/dist/interfaces';
import { DeletionConsoleTestModule } from './deletion-console.app.module';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { DeletionExecutionUc } from './uc';

// This is inspired by the test cases in the nestjs-console library.
// see e.g:
// - https://github.com/Pop-Code/nestjs-console/blob/master/test/bootstrap.spec.ts
// - https://github.com/Pop-Code/nestjs-console/blob/master/test/console.spec.ts

interface TestCliOptions extends CommonBootstrapConsoleOptions {
	cliName: string;
	commandName?: string;
	subCommandName?: string;
}

export class TestBootstrapConsole extends AbstractBootstrapConsole<TestingModule, TestCliOptions> {
	public create(): Promise<TestingModule> {
		return Test.createTestingModule({
			imports: [this.options.module],
		}).compile();
	}

	public execute(args: string[] = []): Promise<CommandResponse> {
		if (this.options.commandName) {
			args.unshift(this.options.commandName);
		}
		if (this.options.cliName) {
			args.unshift(this.options.cliName);
		}
		args.unshift(process.argv0);
		return this.boot(args);
	}
}

describe('DeletionExecutionConsole (e2e)', () => {
	let app: INestApplicationContext;
	let bootstrap: TestBootstrapConsole;

	beforeAll(async () => {
		bootstrap = new TestBootstrapConsole({
			module: DeletionConsoleTestModule,
			useDecorators: true,
			cliName: 'deletion-console',
			commandName: 'execution',
		});

		app = await bootstrap.init();
	});

	afterEach(() => {
		jest.clearAllMocks();
		// jest.restoreAllMocks();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('module', () => {
		it('initialize the cli', () => {
			const cli = bootstrap.getService().getCli('execution');

			expect(cli).toBeDefined();
		});

		it('Should init the application context', () => {
			expect(app).toBeInstanceOf(NestApplicationContext);
			const options = bootstrap.getOptions();
			expect(options.contextOptions?.logger).toHaveLength(1);
			expect(options.contextOptions?.logger).toContain('error');
		});
	});

	describe('execution ', () => {
		it('should execute a command with multiple args', async () => {
			const service = app.get(DeletionExecutionConsole);
			const mockHandler = jest.spyOn(service, 'triggerDeletionExecution').mockImplementation();

			await bootstrap.execute(['trigger', '--limit', '10', '--runFailed', 'true']);

			expect(mockHandler).toHaveBeenCalledTimes(1);
			expect(mockHandler.mock.calls[0][0]).toEqual({ limit: '10', runFailed: 'true' });

			mockHandler.mockRestore();
		});

		it('should call the use case with the correct arguments', async () => {
			const uc = app.get(DeletionExecutionUc);
			const mockUc = jest.spyOn(uc, 'triggerDeletionExecution').mockImplementation();

			const args = ['trigger', '--limit', '10', '--runFailed', 'true'];

			await bootstrap.boot([process.argv0, 'deletion-console', 'execution', ...args]);

			expect(mockUc).toHaveBeenNthCalledWith(1, 10, true);

			mockUc.mockRestore();
		});
	});
});
