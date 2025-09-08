import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';
import { JwtAuthGuardConfig } from '../config';

export class JwtStrategyOptionsFactory {
	static build(
		jwtFromRequestFunction: JwtFromRequestFunction,
		configService: ConfigService<JwtAuthGuardConfig>
	): StrategyOptions {
		const publicKey = configService.getOrThrow<string>('JWT_PUBLIC_KEY');
		const algorithm = configService.getOrThrow<string>('JWT_SIGNING_ALGORITHM') as Algorithm;

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
