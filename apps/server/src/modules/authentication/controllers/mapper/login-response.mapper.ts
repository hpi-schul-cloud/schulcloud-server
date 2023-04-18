import { LoginResponse } from '../dto';
import { LoginDto } from '../../uc/dto';

export class LoginResponseMapper {
	static mapLoginDtoToResponse(loginDto: LoginDto): LoginResponse {
		const response: LoginResponse = new LoginResponse({ accessToken: loginDto.accessToken });

		return response;
	}
}
