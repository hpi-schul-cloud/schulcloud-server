import { AuditLogger } from '@core/logger';
import { ICurrentUser, JwtPayloadBuilder } from '@infra/auth-guard';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { SessionInfoResponse } from '../controllers/dto';
import { AuthenticationService } from '../services';

@Injectable()
export class LoginUc {
	constructor(
		private readonly authService: AuthenticationService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig,
		private readonly auditLogger: AuditLogger
	) {}

	public async getLoginData(currentUser: ICurrentUser): Promise<string> {
		// With the introduction of the service account switch in shd, this method should no longer be used for service accounts. It should throw an exception for service accounts.
		const jwtPayload = new JwtPayloadBuilder(currentUser).build();
		const accessToken = await this.authService.generateJwtAndAddToWhitelist(jwtPayload, this.config.expiresIn);
		await this.authService.updateLastLogin(currentUser.accountId);

		return accessToken;
	}

	public async getLoginDataForServiceAccount(currentUser: ICurrentUser): Promise<string> {
		this.checkIfServiceAccount(currentUser);
		const jwtPayload = new JwtPayloadBuilder(currentUser).asServiceAccount().build();
		const accessToken = await this.authService.generateJwtAndAddToWhitelist(
			jwtPayload,
			this.config.jwtLifetimeServiceAccountSeconds
		);
		await this.authService.updateLastLogin(currentUser.accountId);

		this.auditLogger.logServiceAccountAction(currentUser.userId, 'ServiceAccountAuthenticated');

		return accessToken;
	}

	public async extendSession(accessToken: string): Promise<SessionInfoResponse> {
		const result = await this.authService.getJwtTtlFromWhitelist(accessToken);

		const sessionInfoResponse = new SessionInfoResponse(result);

		return sessionInfoResponse;
	}

	private checkIfServiceAccount(currentUser: ICurrentUser): void {
		if (!currentUser.isServiceAccount) {
			throw new UnauthorizedException();
		}
	}
}
