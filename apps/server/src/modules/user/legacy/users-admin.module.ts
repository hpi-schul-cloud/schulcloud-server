import { Module } from '@nestjs/common';
import { UserRepo } from '@shared/repo/user';
import { LoggerModule } from '@src/core/logger';
import { UsersAdminRepo } from './repo';
import { UsersAdminService } from './service';

@Module({
	imports: [LoggerModule],
	providers: [UserRepo, UsersAdminService, UsersAdminRepo],
	exports: [UsersAdminService],
})
export class UsersAdminModule {}
