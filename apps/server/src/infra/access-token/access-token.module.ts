import { ValkeyClientModule } from '@infra/valkey-client';
import { DynamicModule, Module } from '@nestjs/common';
import { ACCESS_TOKEN_VALKEY_CLIENT, AccessTokenModuleOptions } from './access-token.config';
import { AccessTokenService } from './domain';

@Module({})
export class AccessTokenModule {
	public static register(options: AccessTokenModuleOptions): DynamicModule {
		const { configInjectionToken, configConstructor } = options;

		return {
			module: AccessTokenModule,
			imports: [
				ValkeyClientModule.register({
					clientInjectionToken: ACCESS_TOKEN_VALKEY_CLIENT,
					configInjectionToken,
					configConstructor,
				}),
			],
			providers: [AccessTokenService],
			exports: [AccessTokenService],
		};
	}
}
