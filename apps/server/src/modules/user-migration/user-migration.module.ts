import { Module } from '@nestjs/common';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { LoggerModule } from '@src/core/logger';
import { SchoolMigrationService, UserMigrationService } from './service';
import { AccountModule } from '../account';

@Module({
	imports: [SchoolModule, SystemModule, UserModule, LoggerModule, AccountModule],
	providers: [UserMigrationService, SchoolMigrationService],
	exports: [UserMigrationService, SchoolMigrationService],
})
export class UserMigrationModule {}
