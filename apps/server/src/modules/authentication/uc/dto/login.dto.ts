import { CookieOptions } from "express";

export class LoginDto {
	accessToken: string;
	cookieOptionsJwt?: CookieOptions;
	cookieOptionsLoggedIn?: CookieOptions;

	constructor(props: LoginDto) {
		this.accessToken = props.accessToken;
		this.cookieOptionsJwt = props.cookieOptionsJwt
		this.cookieOptionsLoggedIn = props.cookieOptionsLoggedIn
	}
}
