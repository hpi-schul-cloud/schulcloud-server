import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '@infra/auth-guard';
import { AuthenticationService } from '../services';

@Injectable()
export class LogoutUc {
	constructor(private readonly authenticationService: AuthenticationService) {}

	async logout(jwt: string): Promise<void> {
		await this.authenticationService.removeJwtFromWhitelist(jwt);
	}

	async externalSystemLogout(user: ICurrentUser): Promise<void> {
		if (!user.systemId) return;
		// TODO support for now only moin.schule
		// TODO check if user logged in from external system

		await this.authenticationService.logoutFromExternalSystem(user.userId, user.systemId);
	}
}
