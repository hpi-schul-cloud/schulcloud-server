import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ErrorUtils } from '@src/core/error/utils';
import { AuthorizationApi, AuthorizationBodyParams, AuthorizedReponse } from './authorization-api-client';

@Injectable()
export class AuthorizationClientAdapter {
	constructor(private readonly authorizationApi: AuthorizationApi) {}

	public async checkPermissionByReferences(params: AuthorizationBodyParams): Promise<AuthorizedReponse> {
		try {
			const response = await this.authorizationApi.authorizationReferenceControllerAuthorizeByReference(params);
			return response.data;
		} catch (err) {
			throw new InternalServerErrorException(
				'AuthorizationClientAdapter:checkPermissionByReferences',
				ErrorUtils.createHttpExceptionOptions(err)
			);
		}
	}
}
