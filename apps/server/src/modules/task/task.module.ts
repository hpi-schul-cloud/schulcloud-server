import { LoggerModule } from '@core/logger';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
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

@Module({
	imports: [
		CopyHelperModule,
		LoggerModule,
		SagaModule,
		FilesStorageClientModule.register({
			exchangeConfigConstructor: FilesStorageClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
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
