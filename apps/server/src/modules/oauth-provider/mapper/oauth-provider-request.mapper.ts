import { Injectable } from '@nestjs/common';
import { AcceptLoginRequestBody } from '@shared/infra/oauth-provider/dto';
import { LoginRequestBody } from '@src/modules/oauth-provider/controller/dto';

@Injectable()
export class OauthProviderRequestMapper {
	mapCreateAcceptLoginRequestBody(
		loginRequestBody: LoginRequestBody,
		currentUserId: string,
		pseudonym: string,
		context?: object
	): AcceptLoginRequestBody {
		return {
			remember: loginRequestBody.remember,
			remember_for: loginRequestBody.remember_for,
			subject: currentUserId,
			force_subject_identifier: pseudonym,
			context,
		};
	}
}
