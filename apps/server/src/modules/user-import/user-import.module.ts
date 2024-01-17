import { LegacySchoolModule } from '@modules/legacy-school';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ImportUserRepo, LegacySchoolRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '../account';
import { AuthorizationModule } from '../authorization';
import { ImportUserController } from './controller/import-user.controller';
import { UserImportConfigModule } from './user-import-config.module';
import { FetchImportUsersService } from './service';
import { UserImportUc } from './uc/user-import.uc';

@Module({
	imports: [LoggerModule, AccountModule, LegacySchoolModule, AuthorizationModule, UserImportConfigModule, HttpModule],
	controllers: [ImportUserController],
	providers: [UserImportUc, ImportUserRepo, LegacySchoolRepo, LegacySystemRepo, UserRepo, FetchImportUsersService],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
