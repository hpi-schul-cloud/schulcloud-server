import { createMock } from '@golevelup/ts-jest';
import { ConsoleWriterService } from '@infra/console';
import { DATABASE_CONFIG_TOKEN } from '@infra/database';
import { Test, TestingModule } from '@nestjs/testing';
import { AbstractBootstrapConsole, BootstrapConsole } from 'nestjs-console';
import { DatabaseManagementUc } from '../../uc/database-management.uc';

export class TestBootstrapConsole extends AbstractBootstrapConsole<TestingModule> {
	create(): Promise<TestingModule> {
		return Test.createTestingModule({
			imports: [this.options.module],
		})
			.overrideProvider(DATABASE_CONFIG_TOKEN)
			.useValue({
				dbUrl: `${process.env.MONGO_TEST_URI}/management-console-test`,
				dbEnsureIndexes: false,
				dbAllowGlobalContext: true,
				dbDebug: false,
			})
			.overrideProvider(DatabaseManagementUc)
			.useValue(createMock<DatabaseManagementUc>())
			.overrideProvider(ConsoleWriterService)
			.useValue(createMock<ConsoleWriterService>())
			.compile();
	}
}

export const execute = async (bootstrap: BootstrapConsole, args: string[]): Promise<void> => {
	await bootstrap.boot([process.argv0, 'console', ...args]);

	return Promise.resolve();
};
