import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { DELETION_CONFIG_TOKEN, DeletionConfig } from './deletion.config';
import {
	DeletionBatchService,
	DeletionExecutionService,
	DeletionLogService,
	DeletionRequestService,
} from './domain/service';
import { DeletionBatchRepo, DeletionBatchUsersRepo, DeletionLogRepo, DeletionRequestRepo } from './repo';

@Module({
	imports: [SagaModule, LoggerModule, ConfigurationModule.register(DELETION_CONFIG_TOKEN, DeletionConfig)],
	providers: [
		DeletionRequestRepo,
		DeletionLogRepo,
		DeletionBatchRepo,
		DeletionBatchUsersRepo,
		DeletionLogService,
		DeletionRequestService,
		DeletionBatchService,
		DeletionExecutionService,
	],
	exports: [DeletionRequestService, DeletionLogService, DeletionBatchService, DeletionExecutionService],
})
export class DeletionModule {}
