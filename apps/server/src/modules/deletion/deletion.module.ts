import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { ClassModule } from '@modules/class';
import {
	DeletionLogService,
	DeletionRequestService,
	DeletionBatchService,
	UserDeletionInjectionService,
	DeletionExecutionService,
} from './domain/service';
import { DeletionLogRepo, DeletionRequestRepo, DeletionBatchRepo, DeletionBatchUsersRepo } from './repo';

@Module({
	// imports: [ClassModule],
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
