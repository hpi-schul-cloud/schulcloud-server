import { CoreModule } from '@core/core.module';
import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { ConfigurationModule } from '@infra/configuration';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
// Direct import of repo of other module is not allowed by architecture rules, but for this legacy temporary code it is acceptable.
import { StorageProviderEntity, StorageProviderRepo } from '@modules/school/repo';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DownloadArchiveUC, LegacyFileArchiveController } from './api';
import { DownloadArchiveService, LegacyFileStorageAdapter } from './domain';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from './legacy-file-archive.config';

@Module({
	imports: [
		CoreModule,
		LoggerModule,
		HttpModule,
		AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
		ErrorModule,
		DatabaseModule.register({
			configInjectionToken: DATABASE_CONFIG_TOKEN,
			configConstructor: DatabaseConfig,
			entities: [StorageProviderEntity],
		}),
		ConfigurationModule.register(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig),
	],
	controllers: [LegacyFileArchiveController],
	providers: [DownloadArchiveService, DownloadArchiveUC, LegacyFileStorageAdapter, StorageProviderRepo],
})
export class LegacyFileArchiveApiModule {}
