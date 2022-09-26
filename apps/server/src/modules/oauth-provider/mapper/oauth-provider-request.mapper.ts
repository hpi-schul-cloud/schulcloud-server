import { Injectable } from '@nestjs/common';
import { AcceptLoginRequestBody, ProviderLoginResponse } from '@shared/infra/oauth-provider/dto';
import { LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';

@Injectable()
export class OauthProviderRequestMapper {
	static mapCreateAcceptLoginRequestBody(
		loginResponse: ProviderLoginResponse,
		loginRequestBody: LoginRequestBody,
		currentUserId: string,
		pseudonym: string
	): AcceptLoginRequestBody {
		return {
			remember: loginRequestBody.remember,
			remember_for: loginRequestBody.remember_for,
			subject: currentUserId,
			force_subject_identifier: pseudonym,
		};
	}
}
