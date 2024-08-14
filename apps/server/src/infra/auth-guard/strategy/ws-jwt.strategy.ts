import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { JwtExtractor } from '@shared/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtValidationAdapter } from '../adapter';
import { authConfig } from '../auth-config';
import { ICurrentUser, JwtPayload, StrategyType } from '../interface';
import { CurrentUserMapper } from '../mapper';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, StrategyType.WS_JWT) {
	constructor(private readonly jwtValidationAdapter: JwtValidationAdapter) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([JwtExtractor.fromCookie('jwt')]),
			ignoreExpiration: false,
			secretOrKey: authConfig.secret,
			...authConfig.jwtOptions,
		});
	}

	async validate(payload: JwtPayload): Promise<ICurrentUser> {
		const { accountId, jti } = payload;
		// check user exists
		try {
			// check jwt is whitelisted and extend whitelist entry
			await this.jwtValidationAdapter.isWhitelisted(accountId, jti);
			const currentUser = CurrentUserMapper.jwtToICurrentUser(payload);
			return currentUser;
		} catch (err) {
			throw new WsException('Unauthorized access');
		}
	}
}
