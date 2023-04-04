import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../services/authentication.service';
import { CreateJwtPayload } from '../interface/jwt-payload';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginUc {
	constructor(private readonly authService: AuthenticationService) {}

	async getLoginData(userInfo: CreateJwtPayload): Promise<LoginDto> {
		const accessTokenDto: LoginDto = await this.authService.generateJwt(userInfo);

		const loginDto: LoginDto = new LoginDto({
			accessToken: accessTokenDto.accessToken,
		});

		return loginDto;
	}
}
