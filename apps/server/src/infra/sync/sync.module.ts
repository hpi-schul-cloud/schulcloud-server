import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { ConsoleWriterModule } from '@infra/console';
import { EncryptionModule } from '@infra/encryption';
import { RabbitMQWrapperModule } from '@infra/rabbitmq';
import { TspClientModule } from '@infra/tsp-client/tsp-client.module';
import { VidisClientModule } from '@infra/vidis-client';
import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { MediaSourceModule } from '@modules/media-source';
import { ProvisioningModule } from '@modules/provisioning';
import { SchoolModule } from '@modules/school';
import { SchoolLicenseModule } from '@modules/school-license/school-license.module';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { SyncConsole } from './console/sync.console';
import { VidisSyncService, VidisSyncStrategy } from './media-licenses';
import { SyncService } from './service/sync.service';
import { TspFetchService } from './strategy/tsp/tsp-fetch.service';
import { TspOauthDataMapper } from './strategy/tsp/tsp-oauth-data.mapper';
import { TspSchoolService } from './strategy/tsp/tsp-school.service';
import { TspSyncStrategy } from './strategy/tsp/tsp-sync.strategy';
import { SyncUc } from './uc/sync.uc';

@Module({
	imports: [
		LoggerModule,
		ErrorModule,
		ConsoleWriterModule,
		SystemModule,
		SchoolModule,
		SchoolLicenseModule,
		EncryptionModule,
		MediaSourceModule,
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
		VidisSyncService,
		VidisSyncStrategy,
		...((Configuration.get('FEATURE_TSP_SYNC_ENABLED') as boolean)
			? [TspSyncStrategy, TspSchoolService, TspOauthDataMapper, TspFetchService]
			: []),
	],
	exports: [SyncConsole],
})
export class SyncModule {}
