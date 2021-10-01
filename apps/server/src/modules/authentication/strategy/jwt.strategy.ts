import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserFacade } from '@src/modules/user';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';
import { JwtValidationAdapter } from './jwt-validation.adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly userFacade: UserFacade, private readonly jwtValidationAdapter: JwtValidationAdapter) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			...jwtConstants.jwtOptions,
		});
	}

	async validate(payload: JwtPayload): Promise<JwtPayload> {
		// check jwt is whitelisted and extend whitelist entry
		const { accountId, jti } = payload;
		await this.jwtValidationAdapter.isWhitelisted(accountId, jti);
		// check user exists
		const resolvedUser = await this.userFacade.resolveUser(payload);
		payload.user = resolvedUser; // todo decide request.user or request.user.user to be used everywhere
		// TODO: check user/account is active and has one role
		return payload;
	}
}
