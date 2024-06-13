import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { RawAxiosRequestConfig } from 'axios';
import cookie from 'cookie';
import { Request } from 'express';
import { ExtractJwt, JwtFromRequestFunction } from 'passport-jwt';
import { AuthorizationApi, AuthorizationBodyParams } from './authorization-api-client';
import { AuthorizationErrorLoggableException, AuthorizationForbiddenLoggableException } from './error';

@Injectable()
export class AuthorizationClientAdapter {
	constructor(private readonly authorizationApi: AuthorizationApi, @Inject(REQUEST) private request: Request) {}

	public async checkPermissionsByReference(params: AuthorizationBodyParams): Promise<void> {
		const hasPermission = await this.hasPermissionsByReference(params);
		if (!hasPermission) {
			throw new AuthorizationForbiddenLoggableException(params);
		}
	}

	public async hasPermissionsByReference(params: AuthorizationBodyParams): Promise<boolean> {
		const options = this.createOptionParams(params);

		try {
			const response = await this.authorizationApi.authorizationReferenceControllerAuthorizeByReference(
				params,
				options
			);
			const hasPermission = response.data.isAuthorized;

			return hasPermission;
		} catch (error) {
			throw new AuthorizationErrorLoggableException(error, params);
		}
	}

	private createOptionParams(params: AuthorizationBodyParams): RawAxiosRequestConfig<any> {
		const jwt = this.getJWT(params);
		const options: RawAxiosRequestConfig<any> = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJWT(params: AuthorizationBodyParams): string {
		const getJWT = ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), this.fromCookie('jwt')]);
		const jwt = getJWT(this.request) || this.request.headers.authorization;

		if (!jwt) {
			const error = new Error('Authentication is required.');
			throw new AuthorizationErrorLoggableException(error, params);
		}

		return jwt;
	}

	private fromCookie(name: string): JwtFromRequestFunction {
		return (request: Request) => {
			let token: string | null = null;
			const cookies = cookie.parse(request.headers.cookie || '');
			if (cookies && cookies[name]) {
				token = cookies[name];
			}

			return token;
		};
	}
}
