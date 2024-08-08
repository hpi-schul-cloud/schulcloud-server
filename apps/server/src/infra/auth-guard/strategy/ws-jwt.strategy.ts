import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { JwtExtractor } from '@shared/common';
import { jwtConstants } from '@src/imports-from-feathers';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtValidationAdapter } from '../adapter';
import { ICurrentUser, JwtPayload } from '../interface';
import { CurrentUserMapper } from '../mapper';

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
