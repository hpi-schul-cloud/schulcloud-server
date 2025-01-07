import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@infra/console';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { TspClientModule } from '@infra/tsp-client/tsp-client.module';
import { EncryptionModule } from '@infra/encryption';
import { VidisClientModule } from '@infra/vidis-client';
import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { MediaSourceModule } from '@modules/media-source/media-source.module';
import { SchoolModule } from '@modules/school';
import { SchoolLicenseModule } from '@modules/school-license/school-license.module';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
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
import { VidisSyncService, VidisSyncStrategy, VidisFetchService } from './media-licenses';
import { TspSyncMigrationService } from './tsp/tsp-sync-migration.service';


@Module({
	imports: [
		LoggerModule,
		ConsoleWriterModule,
		SystemModule,
		SchoolModule,
		MediaSourceModule,
		HttpModule,
		SchoolLicenseModule,
		EncryptionModule,
		VidisClientModule,
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
	],
	exports: [SyncConsole],
})
export class SyncModule {}
