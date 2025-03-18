import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_DO_REPO, USER_REPO, UserAuthorizableService, UserService } from './domain';
import { UserDoMikroOrmRepo, UserMikroOrmRepo } from './repo';

@Module({
	imports: [RoleModule, LoggerModule, CqrsModule, RegistrationPinModule, CalendarModule, AuthorizationModule],
	providers: [
		{ provide: USER_REPO, useClass: UserMikroOrmRepo },
		{ provide: USER_DO_REPO, useClass: UserDoMikroOrmRepo },
		UserService,
		UserAuthorizableService,
	],
	exports: [UserService, { provide: USER_REPO, useClass: UserMikroOrmRepo }],
})
export class UserModule {}
