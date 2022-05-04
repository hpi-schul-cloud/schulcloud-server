import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@shared/domain';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';
import { JwtExtractor } from './jwt-extractor';
import { JwtValidationAdapter } from './jwt-validation.adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(protected readonly _em: EntityManager, private readonly jwtValidationAdapter: JwtValidationAdapter) {
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
			await this._em.findOneOrFail(User, { id: userId });
		} catch (err) {
			throw new UnauthorizedException('Unauthorized.');
		}

		// TODO: check user/account is active and has one role
		return payload;
	}
}
