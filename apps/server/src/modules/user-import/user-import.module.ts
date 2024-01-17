import { LegacySchoolModule } from '@modules/legacy-school';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ImportUserRepo, LegacySchoolRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { AccountModule } from '../account';
import { AuthorizationModule } from '../authorization';
import { OauthModule } from '../oauth';
import { UserModule } from '../user';
import { ImportUserController } from './controller/import-user.controller';
import { OauthFetchImportUsersService } from './service';
import { UserImportUc } from './uc/user-import.uc';
import { UserImportConfigModule } from './user-import-config.module';

@Module({
	imports: [
		LoggerModule,
		AccountModule,
		LegacySchoolModule,
		AuthorizationModule,
		UserImportConfigModule,
		HttpModule,
		UserModule,
		OauthModule,
	],
	controllers: [ImportUserController],
	providers: [UserImportUc, ImportUserRepo, LegacySchoolRepo, LegacySystemRepo, UserRepo, OauthFetchImportUsersService],
	exports: [],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
