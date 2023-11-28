import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@infra/console';
import { createConfigModuleOptions } from '@src/config';
import { DeletionClient } from '../client';
import { getDeletionClientConfig } from '../client/deletion-client.config';
import { BatchDeletionService } from '../services';
import { BatchDeletionUc, DeletionExecutionUc } from '../uc';
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
