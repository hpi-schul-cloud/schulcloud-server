import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConsoleWriterService } from '@shared/infra/console';
import { DatabaseManagementUc } from '@src/modules/management/uc/database-management.uc';
import { AbstractBootstrapConsole, BootstrapConsole } from 'nestjs-console';

export class TestBootstrapConsole extends AbstractBootstrapConsole<TestingModule> {
	create(): Promise<TestingModule> {
		return Test.createTestingModule({
			imports: [this.options.module],
		})
			.overrideProvider(DatabaseManagementUc)
			.useValue(createMock<DatabaseManagementUc>())
			.overrideProvider(ConsoleWriterService)
			.useValue(createMock<ConsoleWriterService>())
			.compile();
	}
}

export const execute = async (bootstrap: BootstrapConsole, args: string[]): Promise<void> => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const commandResponse = await bootstrap.boot([process.argv0, 'console', ...args]);
	return Promise.resolve();
};
