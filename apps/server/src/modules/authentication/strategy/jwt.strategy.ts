import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { IRole, Role, User } from '@shared/domain';
import { RoleRepo, UserRepo } from '@shared/repo';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { JwtPayload } from '../interface/jwt-payload';
import { JwtExtractor } from './jwt-extractor';
import { JwtValidationAdapter } from './jwt-validation.adapter';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly roleRepo: RoleRepo,
		private readonly jwtValidationAdapter: JwtValidationAdapter
	) {
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

		// check if user exists
		let user: User;
		try {
			user = await this.userRepo.findById(userId);
		} catch (err) {
			throw new UnauthorizedException();
		}

		// check if user has roles
		if (payload.roles.length <= 0) {
			throw new UnauthorizedException();
		}

		const roles: Role[] = await this.roleRepo.findByIds(payload.roles);
		payload.user = {
			firstName: user.firstName,
			lastName: user.lastName,
			id: user.id,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			roles: roles.map((role: Role): IRole => ({ id: role.id, name: role.name })),
			permissions: [],
			schoolId: user.school.id,
		};

		// TODO: check account is active / resolve permissions
		return payload;
	}
}
