import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	DeletionBatchService,
	DeletionExecutionService,
	DeletionLogService,
	DeletionRequestService,
} from './domain/service';
import { DeletionBatchRepo, DeletionBatchUsersRepo, DeletionLogRepo, DeletionRequestRepo } from './repo';

@Module({
	imports: [SagaModule],
	providers: [
		DeletionRequestRepo,
		DeletionLogRepo,
		DeletionBatchRepo,
		DeletionBatchUsersRepo,
		ConfigService<XApiKeyAuthGuardConfig, true>,
		DeletionLogService,
		DeletionRequestService,
		DeletionBatchService,

		DeletionExecutionService,
	],
	exports: [DeletionRequestService, DeletionLogService, DeletionBatchService, DeletionExecutionService],
})
export class DeletionModule {}
