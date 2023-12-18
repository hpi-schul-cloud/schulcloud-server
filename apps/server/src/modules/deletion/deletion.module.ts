import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesStorageClientModule } from '@modules/files-storage-client';
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';
import { XApiKeyConfig } from '../authentication/config/x-api-key.config';
import { DeletionLogService } from './services/deletion-log.service';
import { DeletionLogRepo } from './repo';

@Module({
	imports: [FilesStorageClientModule],
	providers: [
		DeletionRequestRepo,
		DeletionLogRepo,
		ConfigService<XApiKeyConfig, true>,
		DeletionLogService,
		DeletionRequestService,
	],
	exports: [DeletionRequestService, DeletionLogService, FilesStorageClientModule],
})
export class DeletionModule {}
