import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role';
import { forwardRef, Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { CqrsModule } from '@nestjs/cqrs';
import { RegistrationPinModule } from '@modules/registration-pin';
import { CalendarModule } from '@infra/calendar';
import { UserService } from './service';

@Module({
	imports: [
		forwardRef(() => LegacySchoolModule),
		RoleModule,
		AccountModule,
		LoggerModule,
		CqrsModule,
		RegistrationPinModule,
		CalendarModule,
	],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
