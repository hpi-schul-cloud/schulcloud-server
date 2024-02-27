import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { UserRepo } from '@shared/repo';
import { AdminUsersService } from './service';
import { UsersAdminRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [UserRepo, AdminUsersService, UsersAdminRepo],
	exports: [AdminUsersService],
})
export class UsersAdminModule {}
