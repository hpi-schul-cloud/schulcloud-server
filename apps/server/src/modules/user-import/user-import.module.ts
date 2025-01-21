import { SchulconnexClientModule } from '@infra/schulconnex-client/schulconnex-client.module';
import { AccountModule } from '@modules/account';
import { AuthorizationModule } from '@modules/authorization';
import { LegacySchoolModule } from '@modules/legacy-school';
import { OauthModule } from '@modules/oauth/oauth.module';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { UserLoginMigrationModule } from '@modules/user-login-migration';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LegacySchoolRepo } from '@shared/repo/school';
import { UserRepo } from '@shared/repo/user';
import { LoggerModule } from '@src/core/logger';
import { ImportUserController } from './controller/import-user.controller';
import { ImportUserRepo } from './repo';
import { SchulconnexFetchImportUsersService, UserImportService } from './service';
import { UserImportFetchUc, UserImportUc } from './uc';

@Module({
	imports: [
		LoggerModule,
		AccountModule,
		LegacySchoolModule,
		AuthorizationModule,
		HttpModule,
		UserModule,
		OauthModule,
		SchulconnexClientModule.registerAsync(),
		UserLoginMigrationModule,
		SystemModule,
	],
	controllers: [ImportUserController],
	providers: [
		UserImportUc,
		UserImportFetchUc,
		ImportUserRepo,
		LegacySchoolRepo,
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
