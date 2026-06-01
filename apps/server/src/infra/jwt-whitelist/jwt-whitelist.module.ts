import { ConfigurationModule } from '@infra/configuration';
import {
	SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
	ValkeyClientModule,
	ValkeyClientSessionConfig,
} from '@infra/valkey-client';
import { DynamicModule, Module, Type } from '@nestjs/common';
import { JwtWhitelistAdapter } from './adapter';
import { JWT_WHITELIST_CONFIG_TOKEN, JwtWhitelistConfig } from './config';
import { InternalJwtWhitelistConfig } from './interface';
import { JWT_WHITELIST_VALKEY_CLIENT } from './jwt-whitelist.constants';

@Module({})
export class JwtWhitelistModule {
	public static register(
		configInjectionToken: string = JWT_WHITELIST_CONFIG_TOKEN,
		configConstructor: Type<InternalJwtWhitelistConfig> = JwtWhitelistConfig
	): DynamicModule {
		return {
			module: JwtWhitelistModule,
			imports: [
				ValkeyClientModule.register({
					clientInjectionToken: JWT_WHITELIST_VALKEY_CLIENT,
					configInjectionToken: SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
					configConstructor: ValkeyClientSessionConfig,
				}),
				ConfigurationModule.register(configInjectionToken, configConstructor),
			],
			providers: [JwtWhitelistAdapter],
			exports: [JwtWhitelistAdapter],
		};
	}
}
