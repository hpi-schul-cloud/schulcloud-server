import { LoginResponse, OauthLoginResponse } from '../dto';

export class LoginResponseMapper {
	public static mapToLoginResponse(accessToken: string): LoginResponse {
		const response: LoginResponse = new LoginResponse({
			accessToken,
		});

		return response;
	}

	public static mapToOauthLoginResponse(accessToken: string, externalIdToken?: string): OauthLoginResponse {
		const response: OauthLoginResponse = new OauthLoginResponse({
			accessToken,
			externalIdToken,
		});

		return response;
	}
}
