import { DynamicModule, Module, Provider } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtValidationAdapter } from './adapter';
import { JwtStrategy, WsJwtStrategy, XApiKeyStrategy } from './strategy';

export enum AuthGuardOptions {
	JWT = 'jwt',
	WS_JWT = 'ws-jwt',
	X_API_KEY = 'x-api-key',
}

@Module({})
export class AuthGuardModule {
	static register(options: AuthGuardOptions[]): DynamicModule {
		const providers: Provider[] = [JwtValidationAdapter];

		if (options.includes(AuthGuardOptions.JWT)) providers.push(JwtStrategy);

		if (options.includes(AuthGuardOptions.WS_JWT)) providers.push(WsJwtStrategy);

		if (options.includes(AuthGuardOptions.X_API_KEY)) providers.push(XApiKeyStrategy);

		return {
			module: AuthGuardModule,
			imports: [PassportModule],
			providers,
			exports: [JwtValidationAdapter],
		};
	}
}
