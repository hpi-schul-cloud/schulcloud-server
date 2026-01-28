import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
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
import { ImportUserController } from './controller/import-user.controller';
import { ImportUserRepo } from './repo';
import { SchulconnexFetchImportUsersService, UserImportService } from './service';
import { PopulateUserImportFetchUc, UserImportUc } from './uc';
import { USER_IMPORT_CONFIG_TOKEN, UserImportConfig } from './user-import-config';

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
		UserModule,
		ConfigurationModule.register(USER_IMPORT_CONFIG_TOKEN, UserImportConfig),
	],
	controllers: [ImportUserController],
	providers: [
		UserImportUc,
		PopulateUserImportFetchUc,
		ImportUserRepo,
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
