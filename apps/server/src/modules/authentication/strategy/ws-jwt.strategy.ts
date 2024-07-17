import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtExtractor } from '@shared/common';
import { jwtConstants } from '../constants';
import { ICurrentUser } from '../interface';
import { JwtPayload } from '../interface/jwt-payload';
import { CurrentUserMapper } from '../mapper';
import { JwtValidationAdapter } from '../helper/jwt-validation.adapter';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsjwt') {
	constructor(private readonly jwtValidationAdapter: JwtValidationAdapter) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([JwtExtractor.fromCookie('jwt')]),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			...jwtConstants.jwtOptions,
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
