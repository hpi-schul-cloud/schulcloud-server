import { Account } from '@modules/account';
import { Injectable, UnauthorizedException } from '@nestjs/common';
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

	async logoutOidc(logoutToken: string): Promise<void> {
		// Do not publish any information (like the users existence) before validating the logout tokens origin
		try {
			const account: Account = await this.logoutService.getAccountFromLogoutToken(logoutToken);

			await this.authenticationService.removeUserFromWhitelist(account);
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.logger.warning(new ErrorLoggable(error));
			}

			throw new UnauthorizedException();
		}
	}
}
