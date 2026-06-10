import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtExtractor } from '@shared/common/utils';
import { Strategy } from 'passport-jwt';
import { JwtAuthGuardConfig } from '../config';
import { ICurrentUser, JwtPayload } from '../interface';
import { CurrentUserBuilder, JwtStrategyOptionsFactory } from '../mapper';

export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly jwtWhitelistAdapter: JwtWhitelistAdapter,
		config: JwtAuthGuardConfig
	) {
		const strategyOptions = JwtStrategyOptionsFactory.build(JwtExtractor.extractJwtFromRequest, config);

		super(strategyOptions);
	}

	public async validate(payload: JwtPayload): Promise<ICurrentUser> {
		const { accountId, jti } = payload;
		// check user exists
		try {
			// TODO: check user/account is active and has one role
			// check jwt is whitelisted and extend whitelist entry
			await this.jwtWhitelistAdapter.isWhitelisted(accountId, jti);
			const currentUserBuilder = new CurrentUserBuilder(payload)
				.asExternalUser(payload.isExternalUser)
				.withExternalSystem(payload.systemId)
				.asUserSupporter(payload.support)
				.asServiceAccount(payload.isServiceAccount);

			const currentUser = currentUserBuilder.build();

			return currentUser;
		} catch (err) {
			throw new UnauthorizedException('Unauthorized.', { cause: err as Error });
		}
	}
}
