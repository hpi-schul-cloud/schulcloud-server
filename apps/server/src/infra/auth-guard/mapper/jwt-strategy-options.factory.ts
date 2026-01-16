import { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';
import { JwtAuthGuardConfig } from '../config';

export class JwtStrategyOptionsFactory {
	public static build(
		jwtFromRequestFunction: JwtFromRequestFunction,
		configService: JwtAuthGuardConfig
	): StrategyOptions {
		const { jwtPublicKey, jwtSigningAlgorithm, scDomain } = configService;

		const options = {
			jwtFromRequest: jwtFromRequestFunction,
			secretOrKey: jwtPublicKey,
			ignoreExpiration: false,
			algorithms: [jwtSigningAlgorithm],
			issuer: scDomain,
			audience: scDomain,
		};

		return options;
	}
}
