import { CalendarModule } from '@infra/calendar';
import { RegistrationPinModule } from '@modules/registration-pin';
import { RoleModule } from '@modules/role';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserRepo } from '@shared/repo/user';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@core/logger';
import { UserService } from './service';

@Module({
	imports: [RoleModule, LoggerModule, CqrsModule, RegistrationPinModule, CalendarModule],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
