import { LoggerModule } from '@core/logger';
import { CalendarModule } from '@infra/calendar';
import { AuthorizationModule } from '@modules/authorization';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserDORepo, UserRepo } from './repo';
import { UserAuthorizableService, UserService } from './service';

@Module({
	imports: [
		RoleModule,
		LoggerModule,
		CqrsModule,
		RegistrationPinModule,
		CalendarModule,
		// Forwardref can be removed with BC-9169
		forwardRef(() => AuthorizationModule),
	],
	providers: [UserRepo, UserDORepo, UserService, UserAuthorizableService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
