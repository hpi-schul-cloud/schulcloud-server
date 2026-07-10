import { type AcceptLoginRequestBody } from '../../domain';
import { type LoginRequestBody } from '../dto';

export class OauthProviderRequestMapper {
	public static mapCreateAcceptLoginRequestBody(
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
