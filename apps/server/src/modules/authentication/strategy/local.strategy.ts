import { ICurrentUser } from '@infra/auth-guard';
import { IdentityManagementOauthService } from '@infra/identity-management';
import { Account } from '@modules/account';
import { UserService } from '@modules/user';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { TypeGuard } from '@shared/common/guards';
import bcrypt from 'bcryptjs';
import { Strategy } from 'passport-local';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly idmOauthService: IdentityManagementOauthService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig,
		private readonly userService: UserService
	) {
		super();
	}

	public async validate(username?: string, password?: string): Promise<ICurrentUser> {
		({ username, password } = this.cleanupInput(username, password));
		const account = await this.authenticationService.loadAccount(username);

		if (this.config.identityManagementLoginEnabled) {
			const jwt = await this.idmOauthService.resourceOwnerPasswordGrant(username, password);
			TypeGuard.checkNotNullOrUndefined(jwt, new UnauthorizedException());
		} else {
			const accountPassword = TypeGuard.checkNotNullOrUndefined(account.password, new UnauthorizedException());
			await this.checkCredentials(password, accountPassword, account);
		}

		const accountUserId = TypeGuard.checkNotNullOrUndefined(
			account.userId,
			new Error(`login failing, because account ${account.id} has no userId`)
		);
		const user = await this.userService.getUserEntityWithRoles(accountUserId);
		const currentUser = CurrentUserMapper.userToICurrentUser(account.id, user, false);

		return currentUser;
	}

	private cleanupInput(username?: string, password?: string): { username: string; password: string } {
		username = TypeGuard.checkNotNullOrUndefined(username, new UnauthorizedException());
		password = TypeGuard.checkNotNullOrUndefined(password, new UnauthorizedException());
		username = this.authenticationService.normalizeUsername(username);
		password = this.authenticationService.normalizePassword(password);

		return { username, password };
	}

	private async checkCredentials(enteredPassword: string, savedPassword: string, account: Account): Promise<void> {
		this.authenticationService.checkBrutForce(account);
		const samePassword = await bcrypt.compare(enteredPassword, savedPassword);

		if (!samePassword) {
			await this.authenticationService.updateLastTriedFailedLogin(account.id);
			throw new UnauthorizedException();
		}
	}
}
