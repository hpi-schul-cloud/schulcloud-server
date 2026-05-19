import { ICurrentUser, JwtPayloadBuilder } from '@infra/auth-guard';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticationService } from '../services';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';

@Injectable()
export class LoginUc {
	constructor(
		private readonly authService: AuthenticationService,
		@Inject(AUTHENTICATION_CONFIG_TOKEN) private readonly config: AuthenticationConfig
	) {}

	public async getLoginData(currentUser: ICurrentUser): Promise<string> {
		const jwtPayload = new JwtPayloadBuilder(currentUser).build();
		const accessToken = await this.authService.generateJwtAndAddToWhitelist(jwtPayload, this.config.expiresIn);
		await this.authService.updateLastLogin(currentUser.accountId);

		return accessToken;
	}

	public async getLoginDataForSystemUser(currentUser: ICurrentUser): Promise<string> {
		this.checkIfSystemUser(currentUser);
		const jwtPayload = new JwtPayloadBuilder(currentUser).asSystemUser().build();
		const accessToken = await this.authService.generateJwtAndAddToWhitelist(
			jwtPayload,
			this.config.jwtLifetimeSystemUserSeconds
		);
		await this.authService.updateLastLogin(currentUser.accountId);

		return accessToken;
	}

	private checkIfSystemUser(currentUser: ICurrentUser): void {
		if (!currentUser.isServiceAccount) {
			throw new UnauthorizedException();
		}
	}
}
