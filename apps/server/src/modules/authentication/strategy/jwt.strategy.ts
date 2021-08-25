import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';
import { UserFacade } from '../../user';
import { LegacyJwtAuthenticationAdapter } from './legacy-jwt-authentication.adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly legacyAuthenticationAdapter: LegacyJwtAuthenticationAdapter
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			...jwtConstants.jwtOptions,
		});
	}

	async validate(payload: JwtPayload): Promise<JwtPayload> {
		// check jwt is whitelisted, extend whitelist entry
		const { accountId, jti } = payload;
		await this.legacyAuthenticationAdapter.jwtIsWhitelisted(accountId, jti);
		// TODO: throw not authentication error if user not exist or is not activated
		const resolvedUser = await this.userFacade.resolveUser(payload);
		payload.user = resolvedUser; // todo decide request.user or request.user.user to be used everywhere
		// TODO: check user is active
		// user.authenticate(); // ==> account.isActive() // todo active and not expired
		// todo check jwt is whitelisted
		return payload;
	}
}
