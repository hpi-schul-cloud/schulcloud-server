import { Account, AccountService } from '@modules/account';
import { OAuthService } from '@modules/oauth';
import { System, SystemService } from '@modules/system';
import { UserService } from '@modules/user';
import { Injectable } from '@nestjs/common';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { UserDO } from '@shared/domain/domainobject';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AccountSystemMismatchLoggableException, InvalidTokenLoggableException } from '../loggable';

@Injectable()
export class LogoutService {
	constructor(
		private readonly systemService: SystemService,
		private readonly oauthService: OAuthService,
		private readonly userService: UserService,
		private readonly accountService: AccountService
	) {}

	async getAccountFromLogoutToken(logoutToken: string): Promise<Account> {
		const decodedLogoutToken: JwtPayload | null = jwt.decode(logoutToken, { json: true });

		if (!decodedLogoutToken || !decodedLogoutToken.iss || !decodedLogoutToken.sub) {
			throw new InvalidTokenLoggableException();
		}

		const system: System | null = await this.systemService.findByOauth2Issuer(decodedLogoutToken.iss);

		if (!system?.oauthConfig) {
			throw new NotFoundLoggableException(System.name, { 'oauthConfig.issuer': decodedLogoutToken.iss });
		}

		await this.oauthService.validateLogoutToken(logoutToken, system.oauthConfig);

		const externalId: string = decodedLogoutToken.sub;

		const user: UserDO | null = await this.userService.findByExternalId(externalId, system.id);

		if (!user?.id) {
			throw new NotFoundLoggableException('User', { externalId, systemId: system.id });
		}

		const account: Account | null = await this.accountService.findByUserId(user.id);

		if (!account) {
			throw new NotFoundLoggableException(Account.name, { userId: user.id });
		}

		if (account.systemId !== system.id) {
			throw new AccountSystemMismatchLoggableException(account.systemId, system.id);
		}

		return account;
	}
}
