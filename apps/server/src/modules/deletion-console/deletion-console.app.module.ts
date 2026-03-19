import { ErrorModule } from '@core/error';
import { ConfigurationModule } from '@infra/configuration';
import { ConsoleWriterModule } from '@infra/console';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { AccountModule } from '@modules/account';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { DeletionClient } from './deletion-client';
import { DELETION_CONSOLE_CONFIG_TOKEN, DeletionConsoleConfig } from './deletion-console.config';
import { ENTITIES } from './deletion-console.entity.imports';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { DeletionQueueConsole } from './deletion-queue.console';
import { BatchDeletionService } from './services';
import { BatchDeletionUc, DeletionExecutionUc } from './uc';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		UserModule,
		ConfigurationModule.register(DELETION_CONSOLE_CONFIG_TOKEN, DeletionConsoleConfig),
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: ENTITIES,
		}),
		AccountModule,
		HttpModule,
		ErrorModule,
	],
	providers: [
		DeletionClient,
		DeletionQueueConsole,
		BatchDeletionUc,
		BatchDeletionService,
		DeletionExecutionConsole,
		DeletionExecutionUc,
	],
})
export class DeletionConsoleModule {}
