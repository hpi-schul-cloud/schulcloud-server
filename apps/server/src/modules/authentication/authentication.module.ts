import { AuthGuardModule } from '@infra/auth-guard';
import { CacheWrapperModule } from '@infra/cache';
import { IdentityManagementModule } from '@infra/identity-management';
import { AccountModule } from '@modules/account';
import { OauthModule } from '@modules/oauth/oauth.module';
import { RoleModule } from '@modules/role';
import { SystemModule } from '@modules/system';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LegacySchoolRepo, UserRepo } from '@shared/repo';
import { LoggerModule } from '@src/core/logger';
import { JwtWhitelistAdapter } from './helper/jwt-whitelist.adapter';
import { AuthenticationService } from './services/authentication.service';
import { LdapService } from './services/ldap.service';
import { LdapStrategy } from './strategy/ldap.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { Oauth2Strategy } from './strategy/oauth2.strategy';
import { JwtModuleOptionsFactory } from './jwt-module-options.factory';

@Module({
	imports: [
		LoggerModule,
		PassportModule,
		JwtModule.registerAsync({ useClass: JwtModuleOptionsFactory }),
		AccountModule,
		SystemModule,
		OauthModule,
		RoleModule,
		IdentityManagementModule,
		CacheWrapperModule,
		AuthGuardModule,
	],
	providers: [
		UserRepo,
		LegacySchoolRepo,
		LocalStrategy,
		AuthenticationService,
		LdapService,
		LdapStrategy,
		Oauth2Strategy,
		JwtWhitelistAdapter,
	],
	exports: [AuthenticationService],
})
export class AuthenticationModule {}
