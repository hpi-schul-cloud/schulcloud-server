import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '@infra/auth-guard';
import { System, SystemService } from '@modules/system';
import { OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { ConfigService } from '@nestjs/config';
import { AuthenticationConfig } from '../authentication-config';
import { AuthenticationService } from '../services';
import { ExternalSystemLogoutIsDisabledLoggableException } from '../errors';

@Injectable()
export class LogoutUc {
	constructor(
		private readonly authenticationService: AuthenticationService,
		private readonly configService: ConfigService<AuthenticationConfig, true>,
		private readonly systemService: SystemService,
		private readonly oauthSessionTokenService: OauthSessionTokenService
	) {}

	async logout(jwt: string): Promise<void> {
		await this.authenticationService.removeJwtFromWhitelist(jwt);
	}

	async externalSystemLogout(user: ICurrentUser): Promise<void> {
		if (!this.configService.get<boolean>('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')) {
			throw new ExternalSystemLogoutIsDisabledLoggableException();
		}

		if (!user.systemId) {
			return;
		}

		const system: System | null = await this.systemService.findById(user.systemId);
		const sessionToken: OauthSessionToken | null = await this.oauthSessionTokenService.findLatestByUserId(user.userId);

		if (!sessionToken || !system) {
			return;
		}

		await this.authenticationService.logoutFromExternalSystem(sessionToken, system);
	}
}
