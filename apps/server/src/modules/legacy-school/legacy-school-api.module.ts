import { Module } from '@nestjs/common';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { UserLoginMigrationModule } from '../user-login-migration/user-login-migration.module';
import { LegacySchoolController } from './controller/legacy-school.controller';
import { LegacySchoolModule } from './legacy-school.module';
import { MigrationMapper } from './mapper/migration.mapper';
import { LegacySchoolUc } from './uc/legacy-school.uc';

/**
 * @deprecated because it uses the deprecated LegacySchoolDo.
 */
@Module({
	imports: [LegacySchoolModule, AuthorizationModule, LoggerModule, UserLoginMigrationModule],
	controllers: [LegacySchoolController],
	providers: [LegacySchoolUc, MigrationMapper],
})
export class LegacySchoolApiModule {}
