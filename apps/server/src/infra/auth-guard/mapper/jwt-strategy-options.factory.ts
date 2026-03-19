import { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';
import { JwtAuthGuardConfig } from '../config';

export class JwtStrategyOptionsFactory {
	public static build(jwtFromRequestFunction: JwtFromRequestFunction, config: JwtAuthGuardConfig): StrategyOptions {
		const { jwtPublicKey, jwtSigningAlgorithm, scDomain } = config;

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
