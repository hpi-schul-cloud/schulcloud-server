import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { JwtExtractor } from '@shared/common/utils';
import { Strategy } from 'passport-jwt';
import { JwtValidationAdapter } from '../adapter';
import { JwtAuthGuardConfig } from '../config';
import { ICurrentUser, JwtPayload } from '../interface';
import { CurrentUserBuilder, JwtStrategyOptionsFactory } from '../mapper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly jwtValidationAdapter: JwtValidationAdapter,
		configService: ConfigService<JwtAuthGuardConfig>
	) {
		const strategyOptions = JwtStrategyOptionsFactory.build(JwtExtractor.extractJwtFromRequest, configService);

		super(strategyOptions);
	}

	async validate(payload: JwtPayload): Promise<ICurrentUser> {
		const { accountId, jti } = payload;
		// check user exists
		try {
			// TODO: check user/account is active and has one role
			// check jwt is whitelisted and extend whitelist entry
			await this.jwtValidationAdapter.isWhitelisted(accountId, jti);
			const currentUser = new CurrentUserBuilder(payload)
				.asExternalUser(payload.isExternalUser)
				.withExternalSystem(payload.systemId)
				.asUserSupporter(payload.support)
				.build();

			return currentUser;
		} catch (err) {
			throw new UnauthorizedException('Unauthorized.', { cause: err as Error });
		}
	}
}
