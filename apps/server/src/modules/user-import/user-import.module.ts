import { RegisterTimeoutConfig } from '@core/interceptor/register-timeout-config.decorator';
import { LoggerModule } from '@core/logger';
import { ConfigurationModule } from '@infra/configuration';
import { SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig } from '@infra/schulconnex-client';
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
import { USER_IMPORT_TIMEOUT_CONFIG_TOKEN, UserImportTimeoutConfig } from './timeout.config';
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
		SchulconnexClientModule.register(SCHULCONNEX_CLIENT_CONFIG_TOKEN, SchulconnexClientConfig),
		UserLoginMigrationModule,
		SystemModule,
		UserModule,
		ConfigurationModule.register(USER_IMPORT_CONFIG_TOKEN, UserImportConfig),
		ConfigurationModule.register(USER_IMPORT_TIMEOUT_CONFIG_TOKEN, UserImportTimeoutConfig),
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
@RegisterTimeoutConfig(USER_IMPORT_TIMEOUT_CONFIG_TOKEN)
/**
 * Module to provide user migration,
 * to link existing users with ldap references to enable
 * external authentication and sync.
 */
export class ImportUserModule {}
