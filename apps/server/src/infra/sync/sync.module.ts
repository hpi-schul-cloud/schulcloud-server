import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { SyncConsole } from './console/sync.console';
import { SyncUc } from './uc/sync.uc';
import { SyncService } from './service/sync.service';
import { TspSyncStrategy } from './tsp/tsp-sync.strategy';

@Module({
	imports: [LoggerModule, ConsoleWriterModule],
	providers: [SyncConsole, SyncUc, SyncService, TspSyncStrategy],
	exports: [SyncConsole],
})
export class SyncModule {}
