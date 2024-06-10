import { ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ErrorUtils } from '@src/core/error/utils';
import { Request } from 'express';
import { AuthorizationApi, AuthorizationBodyParams } from './authorization-api-client';

@Injectable()
export class AuthorizationClientAdapter {
	constructor(private readonly authorizationApi: AuthorizationApi, @Inject(REQUEST) private request: Request) {}

	public async checkPermissionByReferences(params: AuthorizationBodyParams): Promise<void> {
		if (!(await this.hasPermissionByReferences(params))) {
			throw new ForbiddenException('AuthorizationClientAdapter:checkPermissionByReferences');
		}
	}

	public async hasPermissionByReferences(params: AuthorizationBodyParams): Promise<boolean> {
		try {
			const tokenStr = this.request.headers.authorization || '';

			const response = await this.authorizationApi.authorizationReferenceControllerAuthorizeByReference(params, {
				headers: { Authorization: `Bearer ${tokenStr}` },
			});

			const hasPermission = response.data.isAuthorized;

			return hasPermission;
		} catch (err) {
			throw new InternalServerErrorException(
				'AuthorizationClientAdapter:hasPermissionByReferences',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}
}
