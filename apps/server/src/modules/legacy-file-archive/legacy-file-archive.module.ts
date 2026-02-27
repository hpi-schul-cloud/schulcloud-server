import { CoreModule } from '@core/core.module';
import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { DATABASE_CONFIG_TOKEN, DatabaseConfig, DatabaseModule } from '@infra/database';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { DownloadArchiveController } from './api/download-archive.controller';
import { DownloadArchiveUC } from './api/download-archive.uc';
import { DownloadArchiveService } from './domain';
import { FileEntity } from './entity';
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
			entities: [FileEntity],
		}),
	],
	controllers: [DownloadArchiveController],
	providers: [DownloadArchiveService, DownloadArchiveUC, StorageProviderRepo, FilesRepo],
})
export class LegacyFileArchiveApiModule {}
