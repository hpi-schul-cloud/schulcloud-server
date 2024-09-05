import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ConsoleWriterModule } from '@infra/console';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { SyncConsole } from './console/sync.console';
import { SyncUc } from './uc/sync.uc';
import { SyncService } from './service/sync.service';
import { TspSyncStrategy } from './tsp/tsp-sync.strategy';

@Module({
	imports: [LoggerModule, ConsoleWriterModule],
	providers: [
		SyncConsole,
		SyncUc,
		SyncService,
		...((Configuration.get('FEATURE_TSP_SYNC_ENABLED ') as boolean) ? [TspSyncStrategy] : []),
	],
	exports: [SyncConsole],
})
export class SyncModule {}
