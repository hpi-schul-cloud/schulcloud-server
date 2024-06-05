import { Injectable } from '@nestjs/common';
import {
	AuthorizationApi,
	AuthorizationBodyParams,
	AuthorizationBodyParamsReferenceType,
	AuthorizationContextParams,
	AuthorizedReponse,
} from './authorization-api-client';

@Injectable()
export class AuthorizationClientAdapter {
	constructor(private readonly authorizationApi: AuthorizationApi) {}

	public async checkPermissionByReferences(
		referenceType: AuthorizationBodyParamsReferenceType,
		referenceId: string,
		context: AuthorizationContextParams
	): Promise<AuthorizedReponse> {
		const params: AuthorizationBodyParams = {
			context,
			referenceType,
			referenceId,
		};

		const response = await this.authorizationApi.authorizationReferenceControllerAuthorizeByReference(params);

		return response.data;
	}
}
