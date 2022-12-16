import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UserRepo } from '@shared/repo';
import { ICurrentUser } from '@shared/domain';
import { CurrentUserMapper } from '@shared/domain/mapper/current-user.mapper';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly authenticationService: AuthenticationService, private readonly userRepo: UserRepo) {
		super();
	}

	async validate(username?: string, password?: string): Promise<ICurrentUser> {
		if (!username || !password) {
			throw new UnauthorizedException();
		}
		username = this.authenticationService.normalizeUsername(username);
		password = this.authenticationService.normalizePassword(password);
		const account = await this.authenticationService.loadAccount(username);
		if (!account.password) {
			throw new UnauthorizedException();
		}
		this.authenticationService.checkBrutForce(account);
		if (!(await bcrypt.compare(password, account.password))) {
			await this.authenticationService.updateLastTriedFailedLogin(account.id);
			throw new UnauthorizedException();
		}
		if (!account.userId) {
			throw new Error(`login failing, because account ${account.id} has no userId`);
		}
		const user = await this.userRepo.findById(account.userId);
		const currentUser = CurrentUserMapper.userToICurrentUser(account.id, user);
		return currentUser;
	}
}
