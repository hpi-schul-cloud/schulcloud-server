import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role/role.module';
import { forwardRef, Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@modules/account';
import { RoleModule } from '@modules/role/role.module';
import { LegacySchoolModule } from '@modules/legacy-school';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrsModule } from '@nestjs/cqrs';
import { RegistrationPinModule } from '@modules/registration-pin';
import { UserService } from './service/user.service';

@Module({
	imports: [LegacySchoolModule, RoleModule, AccountModule, LoggerModule, CqrsModule],
	imports: [
		forwardRef(() => LegacySchoolModule),
		RoleModule,
		AccountModule,
		LoggerModule,
		CqrsModule,
		RegistrationPinModule,
	],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
