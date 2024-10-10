import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@infra/console';
import { TspClientModule } from '@infra/tsp-client/tsp-client.module';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { SyncConsole } from './console/sync.console';
import { SyncService } from './service/sync.service';
import { TspSyncService } from './tsp/tsp-sync.service';
import { TspSyncStrategy } from './tsp/tsp-sync.strategy';
import { SyncUc } from './uc/sync.uc';

@Module({
	imports: [
		RabbitMQWrapperModule,
		LoggerModule,
		ConsoleWriterModule,
		...((Configuration.get('FEATURE_TSP_SYNC_ENABLED') as boolean)
			? [TspClientModule, SystemModule, SchoolModule, LegacySchoolModule]
			: []),
	],
	providers: [
		SyncConsole,
		SyncUc,
		SyncService,
		...((Configuration.get('FEATURE_TSP_SYNC_ENABLED') as boolean) ? [TspSyncStrategy, TspSyncService] : []),
	],
	exports: [SyncConsole],
})
export class SyncModule {}
