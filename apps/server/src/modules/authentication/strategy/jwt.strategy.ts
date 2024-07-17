import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { extractJwtFromHeader } from '@shared/common';
import { jwtConstants } from '../constants';
import { ICurrentUser } from '../interface';
import { JwtPayload } from '../interface/jwt-payload';
import { CurrentUserMapper } from '../mapper';
import { JwtValidationAdapter } from '../helper/jwt-validation.adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly jwtValidationAdapter: JwtValidationAdapter) {
		super({
			jwtFromRequest: extractJwtFromHeader,
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			...jwtConstants.jwtOptions,
		});
	}

	async validate(payload: JwtPayload): Promise<ICurrentUser> {
		const { accountId, jti } = payload;
		// check user exists
		try {
			// TODO: check user/account is active and has one role
			// check jwt is whitelisted and extend whitelist entry
			await this.jwtValidationAdapter.isWhitelisted(accountId, jti);
			const currentUser = CurrentUserMapper.jwtToICurrentUser(payload);
			return currentUser;
		} catch (err) {
			throw new UnauthorizedException('Unauthorized.', { cause: err as Error });
		}
	}
}
