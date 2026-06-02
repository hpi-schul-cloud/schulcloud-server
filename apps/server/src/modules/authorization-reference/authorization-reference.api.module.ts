import { AccessTokenModule } from '@infra/access-token';
import { AuthGuardModule, AuthGuardOptions, JWT_AUTH_GUARD_CONFIG_TOKEN, JwtAuthGuardConfig } from '@infra/auth-guard';
import { JwtWhitelistModule } from '@infra/jwt-whitelist';
import { SESSION_VALKEY_CLIENT_CONFIG_TOKEN, ValkeyClientSessionConfig } from '@infra/valkey-client';
import { Module } from '@nestjs/common';
import { AuthorizationReferenceController, AuthorizationReferenceUc } from './api';
import { AuthorizationReferenceModule } from './authorization-reference.module';

@Module({
	imports: [
		AuthorizationReferenceModule,
		AccessTokenModule.register({
			configInjectionToken: SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
			configConstructor: ValkeyClientSessionConfig,
		}),
		AuthGuardModule.register([
			{
				option: AuthGuardOptions.JWT,
				configInjectionToken: JWT_AUTH_GUARD_CONFIG_TOKEN,
				configConstructor: JwtAuthGuardConfig,
			},
		]),
		JwtWhitelistModule.register(),
	],
	providers: [AuthorizationReferenceUc],
	controllers: [AuthorizationReferenceController],
})
export class AuthorizationReferenceApiModule {}
