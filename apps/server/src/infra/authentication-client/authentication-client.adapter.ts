import { AxiosErrorLoggable } from '@infra/error';
import { Injectable } from '@nestjs/common';
import { isAxiosError, RawAxiosRequestConfig } from 'axios';
import { AuthenticationErrorLoggableException } from './error';
import { AuthenticationApi, LocalAuthorizationBodyParams } from './generated';

@Injectable()
export class AuthenticationClientAdapter {
	constructor(private readonly authenticationApi: AuthenticationApi) {}

	public async loginServiceAccount(params: LocalAuthorizationBodyParams): Promise<string> {
		try {
			const response = await this.authenticationApi.loginControllerLoginLocalServiceAccount(params);
			const { accessToken } = response.data;

			return accessToken;
		} catch (error) {
			if (isAxiosError(error)) {
				error = new AxiosErrorLoggable(error, 'AUTHENTICATION_API_LOGIN_FAILED');
			}
			throw new AuthenticationErrorLoggableException(error, params.username);
		}
	}

	public async logout(accessToken: string): Promise<void> {
		try {
			const options: RawAxiosRequestConfig<unknown> = { headers: { authorization: `Bearer ${accessToken}` } };

			await this.authenticationApi.logoutControllerLogout(options);
		} catch (error) {
			if (isAxiosError(error)) {
				error = new AxiosErrorLoggable(error, 'AUTHENTICATION_API_LOGOUT_FAILED');
			}
			throw new AuthenticationErrorLoggableException(error, 'unknown');
		}
	}
}
