import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_DO_REPO, USER_REPO, UserService } from './domain';
import { UserDoMikroOrmRepo, UserMikroOrmRepo } from './repo';
import { UserAuthorizableService } from './domain/service/user-authorizable.service';

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
