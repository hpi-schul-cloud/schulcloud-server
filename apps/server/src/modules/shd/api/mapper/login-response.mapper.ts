import { LoginResponse } from '../dto';

export class LoginResponseMapper {
	public static mapToLoginResponse(accessToken: string): LoginResponse {
		const response: LoginResponse = new LoginResponse({
			accessToken,
		});

		return response;
	}
}
