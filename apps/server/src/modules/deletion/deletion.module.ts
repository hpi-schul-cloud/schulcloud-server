import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeletionLogService, DeletionRequestService } from './domain/service';
import { DeletionLogRepo, DeletionRequestRepo } from './repo';

@Module({
	providers: [
		DeletionRequestRepo,
		DeletionLogRepo,
		ConfigService<XApiKeyAuthGuardConfig, true>,
		DeletionLogService,
		DeletionRequestService,
	],
	exports: [DeletionRequestService, DeletionLogService],
})
export class DeletionModule {}
