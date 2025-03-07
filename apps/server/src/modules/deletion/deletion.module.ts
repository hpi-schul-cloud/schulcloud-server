import { XApiKeyAuthGuardConfig } from '@infra/auth-guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { ClassModule } from '@modules/class';
import {
	DeletionLogService,
	DeletionRequestService,
	DeletionBatchService,
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
		],
	exports: [
		DeletionRequestService,
		DeletionLogService,
		DeletionBatchService,
	],
})
export class DeletionModule {}
