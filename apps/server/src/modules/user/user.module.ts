import { LoggerModule } from '@core/logger';
import { CALENDAR_CONFIG_TOKEN, CalendarConfig, CalendarModule } from '@infra/calendar';
import { ConfigurationModule } from '@infra/configuration';
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
import { DeleteUserCalendarDataStep, DeleteUserRegistrationPinDataStep, DeleteUserStep } from './saga';
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
	],
	providers: [
		UserMikroOrmRepo,
		{ provide: USER_DO_REPO, useClass: UserDoMikroOrmRepo },
		UserService,
		UserAuthorizableService,
		DeleteUserStep,
		DeleteUserCalendarDataStep,
		DeleteUserRegistrationPinDataStep,
		UserEventSubscriber,
	],
	exports: [UserService, UserMikroOrmRepo],
})
export class UserModule {}
