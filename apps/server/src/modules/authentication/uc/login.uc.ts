import { AuditLogger } from '@core/logger';
import { ICurrentUser, JwtPayloadBuilder } from '@infra/auth-guard';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { AuthenticationService } from '../services';

@Injectable()
export class LoginUc {
	constructor(
		private readonly authService: AuthenticationService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig,
		private readonly auditLogger: AuditLogger
	) {}

	public async getLoginData(currentUser: ICurrentUser): Promise<string> {
		this.checkIfNotServiceAccount(currentUser);
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

	private checkIfServiceAccount(currentUser: ICurrentUser): void {
		if (!currentUser.isServiceAccount) {
			throw new UnauthorizedException();
		}
	}

	private checkIfNotServiceAccount(currentUser: ICurrentUser): void {
		if (currentUser.isServiceAccount) {
			throw new UnauthorizedException();
		}
	}
}
