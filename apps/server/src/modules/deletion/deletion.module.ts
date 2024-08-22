import { XApiKeyConfig } from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeletionLogService, DeletionRequestService } from './domain/service';
import { DeletionLogRepo, DeletionRequestRepo } from './repo';

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
