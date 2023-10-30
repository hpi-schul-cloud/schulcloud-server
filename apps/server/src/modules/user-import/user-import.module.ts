import { Module } from '@nestjs/common';
import { ImportUserRepo } from '@shared/repo/importuser/importuser.repo';
import { LegacySchoolRepo } from '@shared/repo/school/legacy-school.repo';
import { SystemRepo } from '@shared/repo/system/system.repo';
import { UserRepo } from '@shared/repo/user/user.repo';
import { LoggerModule } from '@src/core/logger/logger.module';
import { AccountModule } from '../account/account.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { LegacySchoolModule } from '../legacy-school/legacy-school.module';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUc } from './uc/user-import.uc';

@Module({
	imports: [LoggerModule, AccountModule, LegacySchoolModule, AuthorizationModule],
	controllers: [ImportUserController],
	providers: [UserImportUc, ImportUserRepo, LegacySchoolRepo, SystemRepo, UserRepo],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
