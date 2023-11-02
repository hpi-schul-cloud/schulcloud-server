import { Module } from '@nestjs/common';
import { AuthorizationModule } from '@modules/authorization';
import { LoggerModule } from '@src/core/logger';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { LegacySchoolUc } from './uc';
import { LegacySchoolModule } from './legacy-school.module';
import { LegacySchoolController } from './controller/legacy-school.controller';
import { MigrationMapper } from './mapper/migration.mapper';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Module({
	imports: [LegacySchoolModule, AuthorizationModule, LoggerModule, UserLoginMigrationModule],
	controllers: [LegacySchoolController],
	providers: [LegacySchoolUc, MigrationMapper],
})
export class LegacySchoolApiModule {}
