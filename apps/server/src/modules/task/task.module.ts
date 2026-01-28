import { LoggerModule } from '@core/logger';
import { CopyHelperModule } from '@modules/copy-helper';
import {
	FILES_STORAGE_CLIENT_CONFIG_TOKEN,
	FilesStorageClientConfig,
	FilesStorageClientModule,
} from '@modules/files-storage-client';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { SubmissionService, TaskCopyService, TaskService } from './domain';
import { SubmissionRepo, TaskRepo } from './repo';
import { DeleteUserSubmissionDataStep, DeleteUserTaskDataStep } from './saga';
import { UserChangedSchoolTaskHandlerService } from './service/user-changed-school-task-handler.service';
import { RABBITMQ_CONFIG_TOKEN, RabbitMqConfig } from '@infra/rabbitmq';

@Module({
	imports: [
		FilesStorageClientModule,
		CopyHelperModule,
		LoggerModule,
		SagaModule,
		FilesStorageClientModule.register({
			exchangeConstructor: FilesStorageClientConfig,
			exchangeInjectionToken: FILES_STORAGE_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMqConfig,
		}),
	],
	providers: [
		TaskService,
		TaskCopyService,
		SubmissionService,
		TaskRepo,
		SubmissionRepo,
		DeleteUserSubmissionDataStep,
		DeleteUserTaskDataStep,
		UserChangedSchoolTaskHandlerService,
	],
	exports: [TaskService, TaskCopyService, SubmissionService],
})
export class TaskModule {}
