import { ConsoleWriterModule } from '@infra/console';
import { AccountModule } from '@modules/account';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@shared/common/config-module-options';
import { ConsoleModule } from 'nestjs-console';
import { DeletionClient } from './deletion-client';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { DeletionQueueConsole } from './deletion-queue.console';
import { deletionConsoleConfig } from './deletion.config';
import { BatchDeletionService } from './services';
import { BatchDeletionUc, DeletionExecutionUc } from './uc';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		UserModule,
		ConfigModule.forRoot(createConfigModuleOptions(deletionConsoleConfig)),
		AccountModule,
		HttpModule,
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
