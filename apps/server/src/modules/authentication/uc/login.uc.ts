import { Injectable } from '@nestjs/common';
import { ICurrentUser } from '../interface';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from '../services/authentication.service';
import { LoginDto } from './dto';

@Injectable()
export class LoginUc {
	constructor(private readonly authService: AuthenticationService) {}

	async getLoginData(userInfo: ICurrentUser): Promise<LoginDto> {
		const createJwtPayload: CreateJwtPayload = CurrentUserMapper.mapCurrentUserToCreateJwtPayload(userInfo);

		const accessTokenDto: LoginDto = await this.authService.generateJwt(createJwtPayload);

		const loginDto: LoginDto = new LoginDto({
			accessToken: accessTokenDto.accessToken,
		});

		return loginDto;
	}

	async logoutUser(jwt: string, user: ICurrentUser): Promise<void> {
		await this.authService.removeJwtFromWhitelist(jwt);
		if (user.systemId) await this.authService.logoutFromKeycloak(user.userId, user.systemId);
	}
}
