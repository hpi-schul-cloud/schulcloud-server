import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@infra/console';
import { createConfigModuleOptions } from '@src/config';
import { DeletionClient } from '../deletion-client';
import { getDeletionClientConfig } from '../deletion-client/deletion-client.config';
import { BatchDeletionService } from '../deletion/services';
import { BatchDeletionUc, DeletionExecutionUc } from '../deletion/uc';
import { DeletionQueueConsole } from './deletion-queue.console';
import { DeletionExecutionConsole } from './deletion-execution.console';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(getDeletionClientConfig)),
	],
	providers: [
		DeletionClient,
		BatchDeletionService,
		BatchDeletionUc,
		DeletionExecutionUc,
		DeletionQueueConsole,
		DeletionExecutionConsole,
	],
})
export class DeletionConsoleModule {}
