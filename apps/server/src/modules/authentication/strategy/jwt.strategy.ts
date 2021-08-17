import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';
import { UserFacade } from '../../user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly userFacade: UserFacade) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			...jwtConstants.jwtOptions,
		});
	}

	async validate(payload: JwtPayload): Promise<JwtPayload> {
		// TODO: check jwt is whitelisted

		// TODO: throw not authentication error if user not exist or is not activated
		const resolvedUser = await this.userFacade.resolveUser(payload);
		payload.user = resolvedUser; // todo decide request.user or request.user.user to be used everywhere
		// TODO: check user is active
		user.authenticate(); // ==> account.isActive() // todo active and not expired
		// todo check jwt is whitelisted
		return payload;
	}
}
