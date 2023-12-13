import { ConsoleWriterModule } from '@infra/console';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { ConsoleModule } from 'nestjs-console';
import { DeletionClient } from './client';
import { getDeletionClientConfig } from './client/deletion-client.config';
import { DeletionExecutionConsole } from './console/deletion-execution.console';
import { DeletionQueueConsole } from './console/deletion-queue.console';
import { BatchDeletionService } from './services';
import { BatchDeletionUc, DeletionExecutionUc } from './uc';

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
