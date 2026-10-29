import { AuthenticationCodeGrantTokenRequest, OAuthTokenDto, type OauthTokenResponse } from '../dto';
import { OAuthGrantType } from '../types';

export class TokenRequestMapper {
	public static createAuthenticationCodeGrantTokenRequestPayload(
		clientId: string,
		decryptedClientSecret: string,
		code: string,
		redirectUri: string,
		codeVerifier?: string
	): AuthenticationCodeGrantTokenRequest {
		return new AuthenticationCodeGrantTokenRequest({
			client_id: clientId,
			client_secret: decryptedClientSecret,
			redirect_uri: redirectUri,
			grant_type: OAuthGrantType.AUTHORIZATION_CODE_GRANT,
			code,
			code_verifier: codeVerifier,
		});
	}

	public static mapTokenResponseToDto(response: OauthTokenResponse): OAuthTokenDto {
		return new OAuthTokenDto({
			idToken: response.id_token,
			refreshToken: response.refresh_token,
			accessToken: response.access_token,
		});
	}
}
