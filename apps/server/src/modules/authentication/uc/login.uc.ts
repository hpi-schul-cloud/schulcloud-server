import { ICurrentUser } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../services';
import { LoginDto } from './dto';
import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoginUc {
	constructor(private readonly authService: AuthenticationService, private readonly configServicve: ConfigService) {}

	async getLoginData(currentUser: ICurrentUser, createLoginCookies?: boolean): Promise<LoginDto> {
		const jwtToken = await this.authService.generateCurrentUserJwt(currentUser);
		await this.authService.updateLastLogin(currentUser.accountId);

		let cookieOptionsJwt: CookieOptions = {}
		let cookieOptionsLoggedIn: CookieOptions = {}
		if (createLoginCookies) {
			cookieOptionsJwt = {
				httpOnly: this.configServicve.get("COOKIE__JWT_HTTP_ONLY"),
				sameSite: this.configServicve.get('COOKIE__SAME_SITE'),
				secure: this.configServicve.get('COOKIE__SECURE'),
				expires: new Date(Date.now() + this.configServicve.get('COOKIE__EXPIRES_SECONDS')),
			}
			cookieOptionsLoggedIn = {
				httpOnly: this.configServicve.get("COOKIE__HTTP_ONLY"),
				sameSite: this.configServicve.get('COOKIE__SAME_SITE'),
				secure: this.configServicve.get('COOKIE__SECURE'),
				expires: new Date(Date.now() + this.configServicve.get('COOKIE__EXPIRES_SECONDS')),
			}
		}

		const loginDto = new LoginDto({
			accessToken: jwtToken,
			cookieOptionsJwt,
			cookieOptionsLoggedIn
		});

		return loginDto;
	}
}
