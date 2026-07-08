import { type JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { JwtExtractor } from '@shared/common/utils';
import { Strategy } from 'passport-jwt';
import { type ICurrentUser, type InternalJwtAuthGuardConfig, type JwtPayload, StrategyType } from '../interface';
import { CurrentUserBuilder, JwtStrategyOptionsFactory } from '../mapper';

export class WsJwtStrategy extends PassportStrategy(Strategy, StrategyType.WS_JWT) {
	constructor(
		private readonly jwtWhitelistAdapter: JwtWhitelistAdapter,
		config: InternalJwtAuthGuardConfig
	) {
		const strategyOptions = JwtStrategyOptionsFactory.build(JwtExtractor.fromCookie('jwt'), config);
		super(strategyOptions);
	}

	public async validate(payload: JwtPayload): Promise<ICurrentUser> {
		const { accountId, jti } = payload;
		// check user exists
		try {
			// check jwt is whitelisted and extend whitelist entry
			await this.jwtWhitelistAdapter.isWhitelisted(accountId, jti);
			const currentUserBuilder = new CurrentUserBuilder(payload)
				.asExternalUser(payload.isExternalUser)
				.withExternalSystem(payload.systemId)
				.asUserSupporter(payload.support)
				.asServiceAccount(payload.isServiceAccount);

			const currentUser = currentUserBuilder.build();

			return currentUser;
		} catch {
			throw new WsException('Unauthorized access');
		}
	}
}
