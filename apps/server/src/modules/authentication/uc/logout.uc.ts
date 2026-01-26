import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { ICurrentUser } from '@infra/auth-guard';
import { Account } from '@modules/account';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { ExternalSystemLogoutIsDisabledLoggableException } from '../errors';
import { AuthenticationService, LogoutService } from '../services';

@Injectable()
export class LogoutUc {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly logoutService: LogoutService,
		private readonly logger: Logger,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig
	) {}

	public async logout(jwt: string): Promise<void> {
		await this.authenticationService.removeJwtFromWhitelist(jwt);
	}

	public async logoutOidc(logoutToken: string): Promise<void> {
		// Do not publish any information (like the users existence) before validating the logout tokens origin
		try {
			const account: Account = await this.logoutService.getAccountFromLogoutToken(logoutToken);

			await this.authenticationService.removeUserFromWhitelist(account);
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.logger.warning(new ErrorLoggable(error));
			}

			// Must respond with bad request: https://openid.net/specs/openid-connect-backchannel-1_0.html#BCResponse
			throw new BadRequestException();
		}
	}

	public async externalSystemLogout(user: ICurrentUser): Promise<void> {
		if (!this.config.externalSystemLogoutEnabled) {
			throw new ExternalSystemLogoutIsDisabledLoggableException();
		}

		await this.logoutService.externalSystemLogout(user);
	}
}
