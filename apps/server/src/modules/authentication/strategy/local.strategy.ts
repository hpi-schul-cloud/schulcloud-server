import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UserRepo } from '@shared/repo';
import { ICurrentUser, Role } from '@shared/domain';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly authenticationService: AuthenticationService, private readonly userRepo: UserRepo) {
		super();
	}

	async validate(username: string, password: string): Promise<ICurrentUser> {
		const account = await this.authenticationService.loadAccount(username);
		if (!account || !account.password) {
			throw new UnauthorizedException();
		}
		if (!(await bcrypt.compare(password, account.password))) {
			throw new UnauthorizedException();
		}
		if (!account.userId) {
			throw new Error(`login failing, because account ${account.id} has no userId`);
		}
		const user = await this.userRepo.findById(account.userId);
		return {
			accountId: account.id,
			roles: user.roles.getItems().map((role: Role) => role.id),
			schoolId: user.school.id,
			userId: user.id,
		};
	}
}
