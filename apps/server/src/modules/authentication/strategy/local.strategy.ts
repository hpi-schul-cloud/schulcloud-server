import { IdentityManagementConfig, IdentityManagementOauthService } from '@infra/identity-management';
import { Account } from '@modules/account';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { GuardAgainst } from '@shared/common/utils/guard-against';
import { UserRepo } from '@shared/repo';
import bcrypt from 'bcryptjs';
import { Strategy } from 'passport-local';
import { ICurrentUser } from '../interface';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly idmOauthService: IdentityManagementOauthService,
		private readonly configService: ConfigService<IdentityManagementConfig, true>,
		private readonly userRepo: UserRepo
	) {
		super();
	}

	async validate(username?: string, password?: string): Promise<ICurrentUser> {
		({ username, password } = this.cleanupInput(username, password));
		const account = await this.authenticationService.loadAccount(username);

		if (this.configService.get('FEATURE_IDENTITY_MANAGEMENT_LOGIN_ENABLED')) {
			const jwt = await this.idmOauthService.resourceOwnerPasswordGrant(username, password);
			GuardAgainst.nullOrUndefined(jwt, new UnauthorizedException());
		} else {
			const accountPassword = GuardAgainst.nullOrUndefined(account.password, new UnauthorizedException());
			await this.checkCredentials(password, accountPassword, account);
		}

		const accountUserId = GuardAgainst.nullOrUndefined(
			account.userId,
			new Error(`login failing, because account ${account.id} has no userId`)
		);
		const user = await this.userRepo.findById(accountUserId, true);
		const currentUser = CurrentUserMapper.userToICurrentUser(account.id, user, false);
		return currentUser;
	}

	private cleanupInput(username?: string, password?: string): { username: string; password: string } {
		username = GuardAgainst.nullOrUndefined(username, new UnauthorizedException());
		password = GuardAgainst.nullOrUndefined(password, new UnauthorizedException());
		username = this.authenticationService.normalizeUsername(username);
		password = this.authenticationService.normalizePassword(password);
		return { username, password };
	}

	private async checkCredentials(
		enteredPassword: string,
		savedPassword: string,
		account: Account
	): Promise<void | never> {
		this.authenticationService.checkBrutForce(account);
		if (!(await bcrypt.compare(enteredPassword, savedPassword))) {
			await this.authenticationService.updateLastTriedFailedLogin(account.id);
			throw new UnauthorizedException();
		}
	}
}
