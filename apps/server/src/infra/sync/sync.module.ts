import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@infra/console';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { TspClientModule } from '@infra/tsp-client/tsp-client.module';
import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { ProvisioningModule } from '@src/modules/provisioning';
import { SyncConsole } from './console/sync.console';
import { SyncService } from './service/sync.service';
import { TspLegacyMigrationService } from './tsp/tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp/tsp-oauth-data.mapper';
import { TspSyncService } from './tsp/tsp-sync.service';
import { TspSyncStrategy } from './tsp/tsp-sync.strategy';
import { SyncUc } from './uc/sync.uc';
import { TspFetchService } from './tsp/tsp-fetch.service';
import { TspSyncMigrationService } from './tsp/tsp-sync-migration.service';

@Module({
	imports: [
		LoggerModule,
		ConsoleWriterModule,
		...((Configuration.get('FEATURE_TSP_SYNC_ENABLED') as boolean)
			? [
					TspClientModule,
					SystemModule,
					SchoolModule,
					LegacySchoolModule,
					RabbitMQWrapperModule,
					ProvisioningModule,
					UserModule,
					AccountModule,
			  ]
			: []),
	],
	providers: [
		SyncConsole,
		SyncUc,
		SyncService,
		...((Configuration.get('FEATURE_TSP_SYNC_ENABLED') as boolean)
			? [
					TspSyncStrategy,
					TspSyncService,
					TspOauthDataMapper,
					TspFetchService,
					TspLegacyMigrationService,
					TspSyncMigrationService,
			  ]
			: []),
	],
	exports: [SyncConsole],
})
export class SyncModule {}
