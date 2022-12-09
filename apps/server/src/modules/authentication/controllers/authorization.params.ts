import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthorizationParams {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	code?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	error?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	redirect?: string;
}
