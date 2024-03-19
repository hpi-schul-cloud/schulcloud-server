import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeletionRequestService, DeletionLogService } from './domain/service';
import { DeletionRequestRepo, DeletionLogRepo } from './repo';
import { XApiKeyConfig } from '../authentication/config/x-api-key.config';

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
