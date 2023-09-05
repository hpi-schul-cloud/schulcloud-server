import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@src/modules/authorization';
import { LoggerModule } from '@src/core/logger';
import { UserLoginMigrationModule } from '@src/modules/user-login-migration';
import { LegacySchoolUc } from './uc';
import { SchoolMigrationModule } from './school-migration.module';
import { SchoolController } from './controller/school.controller';
import { MigrationMapper } from './mapper/migration.mapper';

@Module({
	imports: [SchoolMigrationModule, AuthorizationModule, LoggerModule, UserLoginMigrationModule],
	controllers: [SchoolController],
	providers: [LegacySchoolUc, MigrationMapper],
})
export class SchoolMigrationApiModule {}
