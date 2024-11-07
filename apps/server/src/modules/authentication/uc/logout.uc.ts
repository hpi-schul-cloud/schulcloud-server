import { Account } from '@modules/account';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorLoggable } from '@src/core/error/loggable';
import { Logger } from '@src/core/logger';
import { AuthenticationService, LogoutService } from '../services';

@Injectable()
export class LogoutUc {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly logoutService: LogoutService,
		private readonly logger: Logger
	) {}

	async logout(jwt: string): Promise<void> {
		await this.authenticationService.removeJwtFromWhitelist(jwt);
	}

	async logoutOidc(logoutToken: string): Promise<void> {
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
}
