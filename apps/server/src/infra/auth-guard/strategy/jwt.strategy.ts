import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { extractJwtFromHeader } from '@shared/common';
import { Strategy } from 'passport-jwt';
import { JwtValidationAdapter } from '../adapter';
import { authConfig } from '../config';
import { ICurrentUser, JwtPayload } from '../interface';
import { CurrentUserBuilder } from '../mapper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly jwtValidationAdapter: JwtValidationAdapter) {
		super({
			jwtFromRequest: extractJwtFromHeader,
			ignoreExpiration: false,
			secretOrKey: authConfig.secret,
			...authConfig.jwtOptions,
		});
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
				.asSupporter(payload.support)
				.build();

			return currentUser;
		} catch (err) {
			throw new UnauthorizedException('Unauthorized.', { cause: err as Error });
		}
	}
}
