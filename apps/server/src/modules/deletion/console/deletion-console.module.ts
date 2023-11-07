import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ConsoleModule } from 'nestjs-console';
import { ConsoleWriterModule } from '@shared/infra/console';
import { createConfigModuleOptions } from '@src/config';
import { DeletionClient, deletionClientConfig } from '../client';
import { BatchDeletionService } from '../services';
import { BatchDeletionUc } from '../uc';
import { DeletionQueueConsole } from './deletion-queue.console';

@Module({
	imports: [
		ConsoleModule,
		ConsoleWriterModule,
		HttpModule,
		ConfigModule.forRoot(createConfigModuleOptions(deletionClientConfig)),
	],
	providers: [DeletionClient, BatchDeletionService, BatchDeletionUc, DeletionQueueConsole],
})
export class DeletionConsoleModule {}
