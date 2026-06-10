import { ConfigurationModule } from '@infra/configuration';
import { JwtWhitelistAdapter, JwtWhitelistModule } from '@infra/jwt-whitelist';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
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
		this.checkOptionsLength(options);

		const providers: Provider[] = [];
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
			imports: [PassportModule, JwtWhitelistModule.register(), ...imports],
			providers,
		};
	}

	private static checkOptionsLength(options: AuthGuardModuleOptions[]): void {
		if (options.length === 0) {
			throw new Error('At least one auth guard option must be provided');
		}
	}

	private static createJwtStrategyProvider(configInjectionToken: string | symbol): Provider {
		return {
			provide: JwtStrategy,
			useFactory: (whitelistAdapter: JwtWhitelistAdapter, config: InternalJwtAuthGuardConfig) =>
				new JwtStrategy(whitelistAdapter, config),
			inject: [JwtWhitelistAdapter, configInjectionToken],
		};
	}

	private static createWsJwtStrategyProvider(configInjectionToken: string | symbol): Provider {
		return {
			provide: WsJwtStrategy,
			useFactory: (whitelistAdapter: JwtWhitelistAdapter, config: InternalJwtAuthGuardConfig) =>
				new WsJwtStrategy(whitelistAdapter, config),
			inject: [JwtWhitelistAdapter, configInjectionToken],
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
