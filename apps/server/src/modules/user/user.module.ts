import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { SagaModule } from '@modules/saga';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_DO_REPO, UserService } from './domain';
import { UserAuthorizableService } from './domain/service/user-authorizable.service';
import { UserDoMikroOrmRepo, UserMikroOrmRepo } from './repo';
import { DeleteUserCalendarDataStep, DeleteUserRegistrationPinDataStep, DeleteUserStep } from './saga';

@Module({
	imports: [
		RoleModule,
		LoggerModule,
		CqrsModule,
		RegistrationPinModule,
		CalendarModule,
		AuthorizationModule,
		SagaModule,
	],
	providers: [
		UserMikroOrmRepo,
		{ provide: USER_DO_REPO, useClass: UserDoMikroOrmRepo },
		UserService,
		UserAuthorizableService,
		DeleteUserStep,
		DeleteUserCalendarDataStep,
		DeleteUserRegistrationPinDataStep,
	],
	exports: [UserService, UserMikroOrmRepo],
})
export class UserModule {}
