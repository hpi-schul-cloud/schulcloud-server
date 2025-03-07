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
import { UserDeletionSaga } from './domain/saga/user-deletion.saga';
import { UserDeletedHandler } from './domain/command/user-deleted.handler';

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
		UserDeletionSaga,
		UserDeletedHandler,
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
