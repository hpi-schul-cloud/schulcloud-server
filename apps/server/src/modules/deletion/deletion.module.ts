import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	DeletionLogService,
	DeletionRequestService,
	DeletionBatchService,
	UserDeletionInjectionService,
	DeletionExecutionService,
} from './domain/service';
import { DeletionLogRepo, DeletionRequestRepo, DeletionBatchRepo, DeletionBatchUsersRepo } from './repo';
import { SagaModule } from '@modules/saga';

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
		UserDeletionInjectionService,
		DeletionExecutionService,
	],
	exports: [
		DeletionRequestService,
		DeletionLogService,
		DeletionBatchService,
		UserDeletionInjectionService,
		DeletionExecutionService,
	],
})
export class DeletionModule {}
