import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthResponse {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	jwt?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	errorcode?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	idToken?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	logoutEndpoint?: string;

	@IsString()
	@IsNotEmpty()
	provider?: string;

	@IsString()
	@IsNotEmpty()
	redirect!: string;
}
