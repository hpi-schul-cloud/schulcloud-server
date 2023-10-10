import { LoginResponse } from '../dto';
import { LoginDto } from '../../uc/dto';

export class LoginResponseMapper {
	static mapToLoginResponse(loginDto: LoginDto, externalIdToken?: string): LoginResponse {
		const response: LoginResponse = new LoginResponse({
			accessToken: loginDto.accessToken,
			externalIdToken,
		});

		return response;
	}
}
