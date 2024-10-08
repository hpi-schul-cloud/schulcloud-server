import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../services';

@Injectable()
export class LogoutUc {
	constructor(private readonly authenticationService: AuthenticationService) {}

	async logout(jwt: string): Promise<void> {
		await this.authenticationService.removeJwtFromWhitelist(jwt);
	}
}
