import { ErrorModule } from '@core/error';
import { LoggerModule } from '@core/logger';
import {
	AUTHORIZATION_CLIENT_CONFIG_TOKEN,
	AuthorizationClientConfig,
	AuthorizationClientModule,
} from '@infra/authorization-client';
import { StorageProviderRepo } from '@modules/school/repo';
import { Module } from '@nestjs/common';
import { DownloadArchiveController } from './api/download-archive.controller';
import { DownloadArchiveUC } from './api/download-archive.uc';
import { DownloadArchiveService } from './domain';
import { FilesRepo } from './repo';

@Module({
	imports: [
		LoggerModule,
		AuthorizationClientModule.register(AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig),
		ErrorModule,
	],
	controllers: [DownloadArchiveController],
	providers: [DownloadArchiveService, DownloadArchiveUC, StorageProviderRepo, FilesRepo],
})
export class LegacyFileArchiveApiModule {}
