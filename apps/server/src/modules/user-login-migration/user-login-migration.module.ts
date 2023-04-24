import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import {
	MigrationCheckService,
	SchoolMigrationService,
	UserLoginMigrationService,
	UserMigrationService,
} from './service';

@Module({
	imports: [SchoolModule, SystemModule, UserModule, LoggerModule, AccountModule],
	providers: [UserMigrationService, SchoolMigrationService, MigrationCheckService, UserLoginMigrationService],
	exports: [UserMigrationService, SchoolMigrationService, MigrationCheckService, UserLoginMigrationService],
})
export class UserLoginMigrationModule {}
