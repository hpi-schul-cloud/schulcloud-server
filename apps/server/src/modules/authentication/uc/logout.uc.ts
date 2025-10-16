import { Account } from '@modules/account';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { ICurrentUser } from '@infra/auth-guard';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService, LogoutService } from '../services';
import { AuthenticationConfig } from '../authentication-config';
import { ExternalSystemLogoutIsDisabledLoggableException } from '../errors';

@Injectable()
export class LogoutUc {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly logoutService: LogoutService,
		private readonly logger: Logger,
		private readonly configService: ConfigService<AuthenticationConfig, true>
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
		if (!this.configService.get<boolean>('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')) {
			throw new ExternalSystemLogoutIsDisabledLoggableException();
		}

		await this.logoutService.externalSystemLogout(user);
	}
}
