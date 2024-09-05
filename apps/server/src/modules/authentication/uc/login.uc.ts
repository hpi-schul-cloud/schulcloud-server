import { ICurrentUser, JwtPayloadFactory } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../services';
import { LoginDto } from './dto';

@Injectable()
export class LoginUc {
	constructor(private readonly authService: AuthenticationService) {}

	async getLoginData(currentUser: ICurrentUser): Promise<LoginDto> {
		const createJwtPayload = JwtPayloadFactory.buildFromCurrentUser(currentUser);

		const accessTokenDto = await this.authService.generateJwt(createJwtPayload);
		await this.authService.updateLastLogin(currentUser.accountId);

		const loginDto = new LoginDto({
			accessToken: accessTokenDto.accessToken,
		});

		return loginDto;
	}
}
