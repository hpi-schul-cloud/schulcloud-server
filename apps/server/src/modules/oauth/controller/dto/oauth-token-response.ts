import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class OauthTokenResponse {
	@IsDefined()
	@IsString()
	@IsNotEmpty()
	access_token!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	refresh_token!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	id_token!: string;
}
