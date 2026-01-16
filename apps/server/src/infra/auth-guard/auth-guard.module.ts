import { ConfigurationModule } from '@infra/configuration';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtValidationAdapter } from './adapter';
import {
	AuthGuardModuleOptions,
	AuthGuardOptions,
	InternalJwtAuthGuardConfig,
	InternalXApiKeyAuthGuardConfig,
} from './interface';
import { JwtStrategy, WsJwtStrategy, XApiKeyStrategy } from './strategy';

@Module({})
export class AuthGuardModule {
	public static register(options: AuthGuardModuleOptions[]): DynamicModule {
		const providers: Provider[] = [JwtValidationAdapter];
		const imports: DynamicModule[] = [];

		options.forEach(({ option, configInjectionToken, configConstructor }) => {
			switch (option) {
				case AuthGuardOptions.JWT:
					imports.push(ConfigurationModule.register(configInjectionToken, configConstructor));
					providers.push(this.createJwtStrategyProvider(configInjectionToken));
					break;
				case AuthGuardOptions.WS_JWT:
					imports.push(ConfigurationModule.register(configInjectionToken, configConstructor));
					providers.push(this.createWsJwtStrategyProvider(configInjectionToken));
					break;
				case AuthGuardOptions.X_API_KEY:
					imports.push(ConfigurationModule.register(configInjectionToken, configConstructor));
					providers.push(this.createXApiKeyStrategyProvider(configInjectionToken));
					break;
				default:
					throw new Error(`Unsupported auth guard option`);
			}
		});

		return {
			module: AuthGuardModule,
			imports: [PassportModule, ...imports],
			providers,
			exports: [JwtValidationAdapter],
		};
	}

	private static createJwtStrategyProvider(configInjectionToken: string | symbol): Provider {
		return {
			provide: JwtStrategy,
			useFactory: (validationAdapter: JwtValidationAdapter, config: InternalJwtAuthGuardConfig) =>
				new JwtStrategy(validationAdapter, config),
			inject: [JwtValidationAdapter, configInjectionToken],
		};
	}

	private static createWsJwtStrategyProvider(configInjectionToken: string | symbol): Provider {
		return {
			provide: WsJwtStrategy,
			useFactory: (validationAdapter: JwtValidationAdapter, config: InternalJwtAuthGuardConfig) =>
				new WsJwtStrategy(validationAdapter, config),
			inject: [JwtValidationAdapter, configInjectionToken],
		};
	}

	private static createXApiKeyStrategyProvider(configInjectionToken: string | symbol): Provider {
		return {
			provide: XApiKeyStrategy,
			useFactory: (config: InternalXApiKeyAuthGuardConfig) => new XApiKeyStrategy(config),
			inject: [configInjectionToken],
		};
	}
}
