import { ConfigurationModule } from '@infra/configuration';
import { EncryptionModule } from '@infra/encryption';
import { JwtIssuerModule } from '@infra/jwt-issuer';
import { LoggerModule } from '@infra/logger';
import { AccountModule } from '@modules/account';
import { LegacySchoolRepo } from '@modules/legacy-school/repo';
import { OauthModule } from '@modules/oauth/oauth.module';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { UserModule } from '@modules/user';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from './authentication-config';
import { AUTHENTICATION_ENCRYPTION_CONFIG_TOKEN, AuthenticationEncryptionConfig } from './encryption.config';
import { Oauth2ContextHelper } from './helper/oauth2-context.helper';
import { LogoutService } from './services';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { ErwinStrategy } from './strategy/erwin.strategy';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';

@Module({
	imports: [
		LoggerModule,
		ConfigurationModule.register(AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig),
		PassportModule,
		JwtIssuerModule,
		AccountModule,
		SystemModule,
		OauthModule,
		RoleModule,
		UserModule,
		HttpModule,
		EncryptionModule.register(AUTHENTICATION_ENCRYPTION_CONFIG_TOKEN, AuthenticationEncryptionConfig),
	],
	providers: [
		LegacySchoolRepo,
		LocalStrategy,
		AuthenticationService,
		LdapService,
		LdapStrategy,
		Oauth2Strategy,
		Oauth2ContextHelper,
		LogoutService,
		ErwinStrategy,
	],
	exports: [AuthenticationService, LogoutService],
})
export class AuthenticationModule {}
