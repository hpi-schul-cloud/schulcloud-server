import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@modules/account';
import { RoleModule } from '@modules/role/role.module';
import { LegacySchoolModule } from '@modules/legacy-school';
import { CqrsModule } from '@nestjs/cqrs';
import { UserService } from './service/user.service';

@Module({
	imports: [LegacySchoolModule, RoleModule, AccountModule, LoggerModule, CqrsModule],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
