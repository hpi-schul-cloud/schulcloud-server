import { Module } from '@nestjs/common';
import { UserLoginMigrationRepo } from '@shared/repo/userloginmigration/user-login-migration.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountModule } from '../account/account.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { SystemModule } from '../system/system.module';
import { UserModule } from '../user/user.module';
import { MigrationCheckService } from './service/migration-check.service';
import { SchoolMigrationService } from './service/school-migration.service';
import { UserLoginMigrationRevertService } from './service/user-login-migration-revert.service';
import { UserLoginMigrationService } from './service/user-login-migration.service';
import { UserMigrationService } from './service/user-migration.service';

@Module({
	imports: [UserModule, LegacySchoolModule, LoggerModule, AccountModule, SystemModule],
	providers: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRepo,
		UserLoginMigrationRevertService,
	],
	exports: [
		UserMigrationService,
		SchoolMigrationService,
		MigrationCheckService,
		UserLoginMigrationService,
		UserLoginMigrationRevertService,
	],
})
export class UserLoginMigrationModule {}
