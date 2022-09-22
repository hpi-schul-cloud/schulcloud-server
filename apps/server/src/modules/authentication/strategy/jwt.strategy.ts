import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserRepo } from '@shared/repo';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';
import { JwtExtractor } from './jwt-extractor';
import { JwtValidationAdapter } from './jwt-validation.adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly userRepo: UserRepo, private readonly jwtValidationAdapter: JwtValidationAdapter) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				ExtractJwt.fromAuthHeaderAsBearerToken(),
				JwtExtractor.fromCookie('jwt'),
			]),
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
