import { OauthSessionToken } from '../../domain';
import { OAuthSessionTokenExpirationResponse } from '../dto';

export class OAuthSessionTokenMapper {
	public static mapToExpirationResponse(sessionToken: OauthSessionToken): OAuthSessionTokenExpirationResponse {
		const response = new OAuthSessionTokenExpirationResponse({
			expiresAt: sessionToken.expiresAt,
		});

		return response;
	}
}
