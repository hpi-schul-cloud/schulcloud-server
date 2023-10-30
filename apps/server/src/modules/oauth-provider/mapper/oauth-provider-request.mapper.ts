import { AcceptLoginRequestBody } from '@shared/infra/oauth-provider/dto/request/accept-login-request.body';
import { LoginRequestBody } from '../controller/dto/request/login-request.body';

export class OauthProviderRequestMapper {
	static mapCreateAcceptLoginRequestBody(
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
