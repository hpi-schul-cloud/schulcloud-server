import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepo } from '@shared/repo';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';
import { JwtValidationAdapter } from './jwt-validation.adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly userRepo: UserRepo, private readonly jwtValidationAdapter: JwtValidationAdapter) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: jwtConstants.secret,
			...jwtConstants.jwtOptions,
		});
	}

	async validate(payload: JwtPayload): Promise<JwtPayload> {
		// check jwt is whitelisted and extend whitelist entry
		const { accountId, jti, userId } = payload;
		await this.jwtValidationAdapter.isWhitelisted(accountId, jti);
		// check user exists
		try {
			await this.userRepo.findById(userId);
		} catch (err) {
			throw new UnauthorizedException('Unauthorized.');
		}

		// TODO: check user/account is active and has one role
		return payload;
	}
}
