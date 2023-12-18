import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeletionRequestService } from './services/deletion-request.service';
import { DeletionRequestRepo } from './repo/deletion-request.repo';
import { XApiKeyConfig } from '../authentication/config/x-api-key.config';
import { DeletionLogService } from './services/deletion-log.service';
import { DeletionLogRepo } from './repo';

@Module({
	providers: [
		DeletionRequestRepo,
		DeletionLogRepo,
		ConfigService<XApiKeyConfig, true>,
		DeletionLogService,
		DeletionRequestService,
	],
	exports: [DeletionRequestService, DeletionLogService],
})
export class DeletionModule {}
