import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { UserRepo } from '@shared/repo';
import { UsersAdminService } from './service';
import { UsersAdminRepo } from './repo';

@Module({
	imports: [LoggerModule],
	providers: [UserRepo, UsersAdminService, UsersAdminRepo],
	exports: [UsersAdminService],
})
export class UsersAdminModule {}
