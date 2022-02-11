import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class TokenRequestParams {
	@IsDefined()
	@IsString()
	@IsNotEmpty()
	client_id!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	client_secret!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	redirect_uri!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	grant_type!: string;

	@IsDefined()
	@IsString()
	@IsNotEmpty()
	code!: string;
}
