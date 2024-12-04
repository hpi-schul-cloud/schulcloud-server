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
import { TspOauthDataMapper } from './tsp/tsp-oauth-data.mapper';
import { TspSyncService } from './tsp/tsp-sync.service';
import { TspSyncStrategy } from './tsp/tsp-sync.strategy';
import { SyncUc } from './uc/sync.uc';
import { TspFetchService } from './tsp/tsp-fetch.service';
import { VidisSyncService, VidisSyncStrategy } from './media-licenses';

@Module({
	imports: [
		LoggerModule,
		ConsoleWriterModule,
		SystemModule,
		SchoolModule,
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
			? [TspSyncStrategy, TspSyncService, TspOauthDataMapper, TspFetchService]
			: []),
		VidisSyncService,
		VidisSyncStrategy,
	],
	exports: [SyncConsole],
})
export class SyncModule {}
