import { Injectable } from '@nestjs/common';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { ICurrentUser } from '../interface/user';
import { CurrentUserMapper } from '../mapper/current-user.mapper';
import { AuthenticationService } from '../services/authentication.service';
import { LoginDto } from './dto/login.dto';

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
}
