import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { AuthorizationApi, AuthorizationBodyParams } from './authorization-api-client';
import { AuthorizationErrorLoggableException, AuthorizationForbiddenLoggableException } from './error';

@Injectable()
export class AuthorizationClientAdapter {
	constructor(private readonly authorizationApi: AuthorizationApi, @Inject(REQUEST) private request: Request) {}

	public async checkPermissionByReferences(params: AuthorizationBodyParams): Promise<void> {
		if (!(await this.hasPermissionByReferences(params))) {
			throw new AuthorizationForbiddenLoggableException(params);
		}
	}

	public async hasPermissionByReferences(params: AuthorizationBodyParams): Promise<boolean> {
		try {
			const tokenStr = this.request.headers.authorization || '';

			const response = await this.authorizationApi.authorizationReferenceControllerAuthorizeByReference(params, {
				headers: { authorization: `${tokenStr}` },
			});

			const hasPermission = response.data.isAuthorized;

			return hasPermission;
		} catch (error) {
			throw new AuthorizationErrorLoggableException(error as Error, params);
		}
	}
}
