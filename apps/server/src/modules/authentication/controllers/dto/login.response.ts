import { ApiProperty } from '@nestjs/swagger';
import { CookieOptions } from 'express';

export class LoginResponse {
	@ApiProperty()
	accessToken: string;
	cookieOptionsJwt: CookieOptions
	cookieOptionsLoggedIn: CookieOptions

	constructor(props: LoginResponse) {
		this.accessToken = props.accessToken;
		this.cookieOptionsJwt = props.cookieOptionsJwt
		this.cookieOptionsLoggedIn = props.cookieOptionsLoggedIn
	}
}
