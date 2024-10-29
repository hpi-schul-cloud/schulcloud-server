import { ConfigService } from '@nestjs/config';
import { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';
import { AuthGuardConfig } from '../auth-guard.config';

export class JwtStrategyOptionsFactory {
	static build(
		jwtFromRequestFunction: JwtFromRequestFunction,
		configService: ConfigService<AuthGuardConfig>
	): StrategyOptions {
		const publicKey = configService.getOrThrow<string>('JWT_PUBLIC_KEY');
		const algorithm = configService.getOrThrow<string>('JWT_SIGNING_ALGORITHM');

		const options = {
			jwtFromRequest: jwtFromRequestFunction,
			secretOrKey: publicKey,
			ignoreExpiration: false,
			algorithms: [algorithm],
			issuer: configService.getOrThrow<string>('SC_DOMAIN'),
			audience: configService.getOrThrow<string>('SC_DOMAIN'),
		};

		return options;
	}
}
