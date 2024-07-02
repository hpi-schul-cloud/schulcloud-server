import { SchulconnexClientModule } from '@infra/schulconnex-client';
import { AccountModule } from '@modules/account';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { OauthModule } from '@modules/oauth';
import { UserModule } from '@modules/user';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ImportUserRepo, LegacySchoolRepo, LegacySystemRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { ImportUserController } from './controller/import-user.controller';
import { SchulconnexFetchImportUsersService, UserImportService } from './service';
import { UserImportFetchUc, UserImportUc } from './uc';
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
		SchulconnexClientModule.registerAsync(),
		UserLoginMigrationModule,
	],
	controllers: [ImportUserController],
	providers: [
		UserImportUc,
		UserImportFetchUc,
		ImportUserRepo,
		LegacySchoolRepo,
		LegacySystemRepo,
		UserRepo,
		UserImportService,
		SchulconnexFetchImportUsersService,
	],
	exports: [UserImportService],
})
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
