import { Module } from '@nestjs/common';
import { SchoolModule } from '@src/modules/school';
import { SystemModule } from '@src/modules/system';
import { UserModule } from '@src/modules/user';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '@src/modules/account';
import { UserMigrationService } from './service';

@Module({
	imports: [SchoolModule, SystemModule, UserModule, LoggerModule, AccountModule],
	providers: [UserMigrationService],
	exports: [UserMigrationService],
})
export class UserMigrationModule {}
