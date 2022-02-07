import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class OauthTokenResponse {
	@IsDefined()
	@IsString()
	@IsNotEmpty()
	accessToken!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	refreshToken!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	idToken!: string;
}
