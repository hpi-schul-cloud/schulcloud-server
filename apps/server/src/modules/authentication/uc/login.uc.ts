import { ICurrentUser } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../services';
import { LoginDto } from './dto';

@Injectable()
export class LoginUc {
	constructor(private readonly authService: AuthenticationService) {}

	async getLoginData(currentUser: ICurrentUser): Promise<LoginDto> {
		const jwtToken = await this.authService.generateCurrentUserJwt(currentUser);
		await this.authService.updateLastLogin(currentUser.accountId);

		const loginDto = new LoginDto({
			accessToken: jwtToken,
		});

		return loginDto;
	}
}
