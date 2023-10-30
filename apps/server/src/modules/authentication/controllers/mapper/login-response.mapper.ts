import { LoginDto } from '../../uc/dto/login.dto';
import { LoginResponse } from '../dto/login.response';
import { OauthLoginResponse } from '../dto/oauth-login.response';

export class LoginResponseMapper {
	static mapToLoginResponse(loginDto: LoginDto): LoginResponse {
		const response: LoginResponse = new LoginResponse({
			accessToken: loginDto.accessToken,
		});

		return response;
	}

	static mapToOauthLoginResponse(loginDto: LoginDto, externalIdToken?: string): OauthLoginResponse {
		const response: OauthLoginResponse = new OauthLoginResponse({
			accessToken: loginDto.accessToken,
			externalIdToken,
		});

		return response;
	}
}
