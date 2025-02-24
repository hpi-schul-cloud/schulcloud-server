import { LoggerModule } from '@core/logger';
import { Module } from '@nestjs/common';
import { UserModule } from '../user.module';
import { UsersAdminRepo } from './repo';
import { UsersAdminService } from './service';

@Module({
	imports: [LoggerModule, UserModule],
	providers: [UsersAdminService, UsersAdminRepo],
	exports: [UsersAdminService],
})
export class UsersAdminModule {}
