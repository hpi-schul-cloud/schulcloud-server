import { AccountModule } from '@modules/account';
import { LegacySchoolModule } from '@modules/legacy-school';
import { RoleModule } from '@modules/role/role.module';
import { forwardRef, Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { LoggerModule } from '@src/core/logger';
import { UserService } from './service/user.service';

@Module({
	imports: [forwardRef(() => LegacySchoolModule), RoleModule, AccountModule, LoggerModule],
	providers: [UserRepo, UserDORepo, UserService],
	exports: [UserService, UserRepo],
})
export class UserModule {}
