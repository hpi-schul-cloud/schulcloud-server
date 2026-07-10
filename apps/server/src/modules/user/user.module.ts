import { CALENDAR_CONFIG_TOKEN, CalendarConfig, CalendarModule } from '@infra/calendar';
import { ConfigurationModule } from '@infra/configuration';
import {
	FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
	FilesStorageAMQPClientConfig,
	FilesStorageAMQPClientModule,
} from '@infra/files-storage-amqp-client';
import { LoggerModule } from '@infra/logger';
import { RABBITMQ_CONFIG_TOKEN, RabbitMQConfig } from '@infra/rabbitmq';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_DO_REPO, UserService } from './domain';
import { UserAuthorizableService } from './domain/service/user-authorizable.service';
import { UserDoMikroOrmRepo, UserMikroOrmRepo } from './repo';
import { UserEventSubscriber } from './repo/user-event-subscriber';
import {
	DeleteUserCalendarDataStep,
	DeleteUserFilesStorageDataStep,
	DeleteUserRegistrationPinDataStep,
	DeleteUserStep,
} from './saga';
import { USER_CONFIG_TOKEN, UserConfig } from './user.config';

@Module({
	imports: [
		RoleModule,
		LoggerModule,
		CqrsModule,
		RegistrationPinModule,
		CalendarModule.register(CALENDAR_CONFIG_TOKEN, CalendarConfig),
		AuthorizationModule,
		SagaModule,
		ConfigurationModule.register(USER_CONFIG_TOKEN, UserConfig),
		FilesStorageAMQPClientModule.register({
			exchangeConfigConstructor: FilesStorageAMQPClientConfig,
			exchangeConfigInjectionToken: FILES_STORAGE_AMQP_CLIENT_CONFIG_TOKEN,
			configInjectionToken: RABBITMQ_CONFIG_TOKEN,
			configConstructor: RabbitMQConfig,
		}),
	],
	providers: [
		UserMikroOrmRepo,
		{ provide: USER_DO_REPO, useClass: UserDoMikroOrmRepo },
		UserService,
		UserAuthorizableService,
		DeleteUserStep,
		DeleteUserCalendarDataStep,
		DeleteUserRegistrationPinDataStep,
		DeleteUserFilesStorageDataStep,
		UserEventSubscriber,
	],
	exports: [UserService, UserMikroOrmRepo],
})
export class UserModule {}
