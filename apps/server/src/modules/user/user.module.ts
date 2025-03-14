import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserAuthorizableService, UserService } from './domain';
import { UserDORepo, UserRepo } from './repo';

@Module({
	imports: [RoleModule, LoggerModule, CqrsModule, RegistrationPinModule, CalendarModule, AuthorizationModule],
	providers: [UserRepo, UserDORepo, UserService, UserAuthorizableService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
