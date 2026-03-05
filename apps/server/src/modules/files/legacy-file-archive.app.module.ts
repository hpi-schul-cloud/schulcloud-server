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
import { StorageProviderEntity, StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { DownloadArchiveUC, LegacyFileArchiveController } from './api';
import { DownloadArchiveService, FILES_REPO } from './domain';
import { FileEntity } from './entity';
import { LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig } from './legacy-file-archive.config';
import { FilesRepo } from './repo';

@Module({
	imports: [
		CoreModule,
		LoggerModule,
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
			entities: [FileEntity, StorageProviderEntity],
		}),
		ConfigurationModule.register(LEGACY_FILE_ARCHIVE_CONFIG_TOKEN, LegacyFileArchiveConfig),
	],
	controllers: [LegacyFileArchiveController],
	providers: [
		DownloadArchiveService,
		DownloadArchiveUC,
		StorageProviderRepo,
		{ provide: FILES_REPO, useClass: FilesRepo },
	],
})
export class LegacyFileArchiveApiModule {}
