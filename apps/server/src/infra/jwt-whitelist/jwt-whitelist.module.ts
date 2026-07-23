import { ConfigurationModule } from '@infra/configuration';
import {
	SESSION_VALKEY_CLIENT_CONFIG_TOKEN,
	type StorageClient,
	ValkeyClientModule,
	ValkeyClientSessionConfig,
} from '@infra/valkey-client';
import { DynamicModule, Module, Type } from '@nestjs/common';
import { JwtWhitelistAdapter } from './adapter';
import { InternalJwtWhitelistConfig } from './interface';
import { DEFAULT_JWT_WHITELIST_CONFIG_TOKEN, DefaultJwtWhitelistConfig } from './jwt-whitelist.config';
import { JWT_WHITELIST_VALKEY_CLIENT } from './jwt-whitelist.constants';

@Module({})
export class JwtWhitelistModule {
	public static register(
		configInjectionToken: string = DEFAULT_JWT_WHITELIST_CONFIG_TOKEN,
		configConstructor: Type<InternalJwtWhitelistConfig> = DefaultJwtWhitelistConfig
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
			providers: [
				{
					provide: JwtWhitelistAdapter,
					useFactory: (storageClient: StorageClient, config: InternalJwtWhitelistConfig) =>
						new JwtWhitelistAdapter(storageClient, config),
					inject: [JWT_WHITELIST_VALKEY_CLIENT, configInjectionToken],
				},
			],
			exports: [JwtWhitelistAdapter],
		};
	}
}
