import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { Module } from '@nestjs/common';
import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { ProvisioningModule } from '@modules/provisioning';
import { TspClientModule } from '@infra/tsp-client';
import { ConsoleWriterModule } from '@infra/console';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { LoggerModule } from '@src/core/logger';
import { SyncConsole } from './console/sync.console';
import { SyncService } from './service/sync.service';
import { TspLegacyMigrationService } from './strategy/tsp/tsp-legacy-migration.service';
import { TspOauthDataMapper } from './strategy/tsp/tsp-oauth-data.mapper';
import { TspSyncService } from './strategy/tsp/tsp-sync.service';
import { TspSyncStrategy } from './strategy/tsp/tsp-sync.strategy';
import { SyncUc } from './uc/sync.uc';
import { TspFetchService } from './strategy/tsp/tsp-fetch.service';

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
			? [TspSyncStrategy, TspSyncService, TspOauthDataMapper, TspFetchService, TspLegacyMigrationService]
			: []),
	],
	exports: [SyncConsole],
})
export class SyncModule {}
