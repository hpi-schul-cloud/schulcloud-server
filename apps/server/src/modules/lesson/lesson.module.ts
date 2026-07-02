import { ConfigurationModule } from '@infra/configuration';
import { FeathersServiceProvider } from '@infra/feathers';
import {
	FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
	FilesStorageAMQPClientConfig,
	FilesStorageAMQPClientModule,
} from '@infra/files-storage-amqp-client';
import { LoggerModule } from '@infra/logger';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { AuthorizationModule } from '@modules/authorization';
import { CopyHelperModule } from '@modules/copy-helper';
import { SagaModule } from '@modules/saga';
import { TaskModule } from '@modules/task';
import { Module } from '@nestjs/common';
import { EtherpadService, LessonCopyService, LessonService } from './domain';
import { LESSON_CONFIG_TOKEN, LessonConfig } from './lesson.config';
import { LessonRepo } from './repo';
import { DeleteUserLessonDataStep } from './saga';

@Module({
	imports: [
		LoggerModule,
		ConfigurationModule.register(LESSON_CONFIG_TOKEN, LessonConfig),
		CopyHelperModule,
		TaskModule,
		AuthorizationModule,
		SagaModule,
		FilesStorageAMQPClientModule.register({
			exchangeConfigConstructor: FilesStorageAMQPClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
	],
	providers: [
		LessonRepo,
		LessonService,
		EtherpadService,
		LessonCopyService,
		FeathersServiceProvider,
		DeleteUserLessonDataStep,
	],
	exports: [LessonService, LessonCopyService],
})
export class LessonModule {}
