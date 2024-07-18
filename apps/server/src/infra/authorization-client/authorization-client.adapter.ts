import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { RawAxiosRequestConfig } from 'axios';
import { Request } from 'express';
import { extractJwtFromHeader } from '@shared/common';
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
		try {
			const options = this.createOptionParams();

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

	private createOptionParams(): RawAxiosRequestConfig<any> {
		const jwt = this.getJwt();
		const options: RawAxiosRequestConfig<any> = { headers: { authorization: `Bearer ${jwt}` } };

		return options;
	}

	private getJwt(): string {
		const jwt = extractJwtFromHeader(this.request) || this.request.headers.authorization;

		if (!jwt) {
			throw new Error('Authentication is required.');
		}

		return jwt;
	}
}
