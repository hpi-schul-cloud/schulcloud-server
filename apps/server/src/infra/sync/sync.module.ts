import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { ConsoleWriterModule } from '@infra/console';
import { TSP_CLIENT_CONFIG_TOKEN, TspClientConfig } from '@infra/tsp-client';
import { TspClientModule } from '@infra/tsp-client/tsp-client.module';
import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { ProvisioningModule } from '@modules/provisioning';
import { SchoolModule } from '@modules/school';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { Module } from '@nestjs/common';
import { SyncConsole } from './console/sync.console';
import { SYNC_ENCRYPTION_CONFIG_TOKEN, SyncEncryptionConfig } from './encryption.config';
import { SyncService } from './service/sync.service';
import { TspFetchService } from './strategy/tsp/tsp-fetch.service';
import { TspOauthDataMapper } from './strategy/tsp/tsp-oauth-data.mapper';
import { TspSchoolService } from './strategy/tsp/tsp-school.service';
import { TspSyncStrategy } from './strategy/tsp/tsp-sync.strategy';
import { SYNC_CONFIG_TOKEN, SyncConfig } from './sync.config';
import { SyncUc } from './uc/sync.uc';

// TODO: This is NOT an @infra module, as it depends on other @modules modules. Needs to be moved!!!
@Module({
	imports: [
		LoggerModule,
		ErrorModule,
		ConsoleWriterModule,
		TspClientModule.register({
			encryptionConfig: {
				configConstructor: SyncEncryptionConfig,
				configInjectionToken: SYNC_ENCRYPTION_CONFIG_TOKEN,
			},
			tspClientConfig: {
				configConstructor: TspClientConfig,
				configInjectionToken: TSP_CLIENT_CONFIG_TOKEN,
			},
		}),
		SystemModule,
		SchoolModule,
		LegacySchoolModule,
		ProvisioningModule,
		UserModule,
		AccountModule,
		ConfigurationModule.register(SYNC_CONFIG_TOKEN, SyncConfig),
	],
	providers: [SyncConsole, SyncUc, SyncService, TspSyncStrategy, TspSchoolService, TspOauthDataMapper, TspFetchService],
	exports: [SyncConsole],
})
export class SyncModule {}
