import { Injectable } from '@nestjs/common';
import { CreateJwtPayload, CurrentUserMapper, ICurrentUser } from '@src/infra/auth-guard';
import { AuthenticationService } from '../services';
import { LoginDto } from './dto';

@Injectable()
export class LoginUc {
	constructor(private readonly authService: AuthenticationService) {}

	async getLoginData(userInfo: ICurrentUser): Promise<LoginDto> {
		const createJwtPayload: CreateJwtPayload = CurrentUserMapper.mapCurrentUserToCreateJwtPayload(userInfo);

		const accessTokenDto: LoginDto = await this.authService.generateJwt(createJwtPayload);

		await this.authService.updateLastLogin(userInfo.accountId);

		const loginDto: LoginDto = new LoginDto({
			accessToken: accessTokenDto.accessToken,
		});

		return loginDto;
	}
}
