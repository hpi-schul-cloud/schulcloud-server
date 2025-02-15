import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@infra/console';
import { EncryptionModule } from '@infra/encryption';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { TspClientModule } from '@infra/tsp-client/tsp-client.module';
import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { ProvisioningModule } from '@modules/provisioning';
import { SchoolModule } from '@modules/school';
import { SchoolLicenseModule } from '@modules/school-license/school-license.module';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { SyncConsole } from './console/sync.console';
import { VidisFetchService, VidisSyncService, VidisSyncStrategy } from './media-licenses';
import { MediaMetadataSyncStrategy } from './media-metadata';
import { SyncService } from './service/sync.service';
import { TspFetchService } from './tsp/tsp-fetch.service';
import { TspLegacyMigrationService } from './tsp/tsp-legacy-migration.service';
import { TspOauthDataMapper } from './tsp/tsp-oauth-data.mapper';
import { TspSyncMigrationService } from './tsp/tsp-sync-migration.service';
import { TspSyncService } from './tsp/tsp-sync.service';
import { TspSyncStrategy } from './tsp/tsp-sync.strategy';
import { SyncUc } from './uc/sync.uc';

@Module({
	imports: [
		LoggerModule,
		ConsoleWriterModule,
		SystemModule,
		SchoolModule,
		MediaSourceModule,
		SchoolLicenseModule,
		EncryptionModule,
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
		VidisSyncService,
		VidisSyncStrategy,
		VidisFetchService,
		MediaMetadataSyncStrategy,
	],
	exports: [SyncConsole],
})
export class SyncModule {}
