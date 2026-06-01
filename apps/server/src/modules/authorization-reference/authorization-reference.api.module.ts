import { AccessTokenModule } from '@infra/access-token';
import { AuthGuardModule } from '@infra/auth-guard';
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
		AuthGuardModule.register([]),
		JwtWhitelistModule.register(),
	],
	providers: [AuthorizationReferenceUc],
	controllers: [AuthorizationReferenceController],
})
export class AuthorizationReferenceApiModule {}
