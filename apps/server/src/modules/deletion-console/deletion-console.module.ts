import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@infra/console';
import { createConfigModuleOptions } from '@src/config';
import { DeletionModule } from '@modules/deletion';
import { DeletionClient } from './deletion-client';
import { getDeletionClientConfig } from './deletion-client/deletion-client.config';
import { DeletionQueueConsole } from './deletion-queue.console';
import { DeletionExecutionConsole } from './deletion-execution.console';
import { BatchDeletionService } from './services';
import { BatchDeletionUc } from './uc';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		DeletionModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(getDeletionClientConfig)),
	],
	providers: [DeletionClient, BatchDeletionService, BatchDeletionUc, DeletionQueueConsole, DeletionExecutionConsole],
})
export class DeletionConsoleModule {}
