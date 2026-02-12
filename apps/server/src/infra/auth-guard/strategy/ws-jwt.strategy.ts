import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { JwtExtractor } from '@shared/common/utils';
import { Strategy } from 'passport-jwt';
import { JwtValidationAdapter } from '../adapter';
import { ICurrentUser, InternalJwtAuthGuardConfig, JwtPayload, StrategyType } from '../interface';
import { CurrentUserBuilder, JwtStrategyOptionsFactory } from '../mapper';

export class WsJwtStrategy extends PassportStrategy(Strategy, StrategyType.WS_JWT) {
	constructor(private readonly jwtValidationAdapter: JwtValidationAdapter, config: InternalJwtAuthGuardConfig) {
		const strategyOptions = JwtStrategyOptionsFactory.build(JwtExtractor.fromCookie('jwt'), config);
		super(strategyOptions);
	}

	public async validate(payload: JwtPayload): Promise<ICurrentUser> {
		const { accountId, jti } = payload;
		// check user exists
		try {
			// check jwt is whitelisted and extend whitelist entry
			await this.jwtValidationAdapter.isWhitelisted(accountId, jti);
			const currentUser = new CurrentUserBuilder(payload)
				.asExternalUser(payload.isExternalUser)
				.withExternalSystem(payload.systemId)
				.asUserSupporter(payload.support)
				.build();

			return currentUser;
		} catch (err) {
			throw new WsException('Unauthorized access');
		}
	}
}
