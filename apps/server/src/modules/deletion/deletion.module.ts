import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeletionLogService, DeletionRequestService, DeletionBatchService } from './domain/service';
import { DeletionLogRepo, DeletionRequestRepo, DeletionBatchRepo, DeletionBatchUsersRepo } from './repo';

@Module({
	providers: [
		DeletionRequestRepo,
		DeletionLogRepo,
		DeletionBatchRepo,
		DeletionBatchUsersRepo,
		ConfigService<XApiKeyAuthGuardConfig, true>,
		DeletionLogService,
		DeletionRequestService,
		DeletionBatchService,
	],
	exports: [DeletionRequestService, DeletionLogService, DeletionBatchService],
})
export class DeletionModule {}
