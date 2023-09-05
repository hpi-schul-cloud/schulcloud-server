import { Module } from '@nestjs/common';
import { ImportUserRepo, LegacySchoolRepo, SystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { SchoolModule } from '@src/modules/school-migration';
import { AccountModule } from '../account';
import { AuthorizationModule } from '../authorization';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportUc } from './uc/user-import.uc';

@Module({
	imports: [LoggerModule, AccountModule, SchoolModule, AuthorizationModule],
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
