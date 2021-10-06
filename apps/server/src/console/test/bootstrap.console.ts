import { Test, TestingModule } from '@nestjs/testing';
import { AbstractBootstrapConsole, BootstrapConsole } from 'nestjs-console';

export class TestBootstrapConsole extends AbstractBootstrapConsole<TestingModule> {
	create(): Promise<TestingModule> {
		return Test.createTestingModule({
			imports: [this.options.module],
		}).compile();
	}
}

export const execute = async (bootstrap: BootstrapConsole, args: string[]): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const commandResponse = await bootstrap.boot([process.argv0, 'console', ...args]);
	return Promise.resolve();
};
