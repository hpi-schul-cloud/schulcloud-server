import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { ConfigurationModule } from '@infra/configuration';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper/copy-helper.module';
import { CourseModule } from '@modules/course';
import { LessonModule } from '@modules/lesson';
import { Module } from '@nestjs/common';
import { SubmissionController, SubmissionUc, TaskController, TaskCopyUC, TaskUC } from './api';
import { TaskRepo } from './repo';
import { TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig } from './task.config';
import { TaskModule } from './task.module';
import { TASK_TIMEOUT_CONFIG_TOKEN, TaskTimeoutConfig } from './timeout.config';
@Module({
	imports: [
		AuthorizationModule,
		CopyHelperModule,
		TaskModule,
		LessonModule,
		CourseModule,
		ConfigurationModule.register(TASK_PUBLIC_API_CONFIG_TOKEN, TaskPublicApiConfig),
		ConfigurationModule.register(TASK_TIMEOUT_CONFIG_TOKEN, TaskTimeoutConfig),
	],
	controllers: [TaskController, SubmissionController],
	providers: [TaskUC, TaskRepo, TaskCopyUC, SubmissionUc],
})
@RegisterTimeoutConfig(TASK_TIMEOUT_CONFIG_TOKEN)
export class TaskApiModule {}
