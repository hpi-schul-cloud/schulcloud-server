import { ICurrentUser } from '@infra/auth-guard';
import { Injectable } from '@nestjs/common';
import { AuthenticationService } from '../services';
import { LoginDto } from './dto';
import { CookieOptions } from 'express';
import { ConfigService } from '@nestjs/config';
import type { AuthenticationConfig } from '../authentication-config';

@Injectable()
export class LoginUc {
	constructor(
		private readonly authService: AuthenticationService,
		private readonly configService: ConfigService<AuthenticationConfig>
	) {}

	async getLoginData(currentUser: ICurrentUser, createLoginCookies?: boolean): Promise<LoginDto> {
		const jwtToken = await this.authService.generateCurrentUserJwt(currentUser);
		await this.authService.updateLastLogin(currentUser.accountId);

		let cookieOptionsJwt: CookieOptions = {};
		let cookieOptionsLoggedIn: CookieOptions = {};

		const cookieExpiresAt = new Date(Date.now() + this.configService.getOrThrow('COOKIE__EXPIRES_SECONDS'));
		if (createLoginCookies) {
			cookieOptionsJwt = {
				httpOnly: this.configService.get('COOKIE__JWT_HTTP_ONLY'),
				sameSite: this.configService.get('COOKIE__SAME_SITE'),
				secure: this.configService.get('COOKIE__SECURE'),
				expires: cookieExpiresAt,
			};
			cookieOptionsLoggedIn = {
				httpOnly: this.configService.get('COOKIE__HTTP_ONLY'),
				sameSite: this.configService.get('COOKIE__SAME_SITE'),
				secure: this.configService.get('COOKIE__SECURE'),
				expires: cookieExpiresAt,
			};
		}

		const loginDto = new LoginDto({
			accessToken: jwtToken,
			cookieOptionsJwt,
			cookieOptionsLoggedIn,
		});

		return loginDto;
	}
}
