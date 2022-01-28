import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthorizationQuery {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	code?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	error?: string;
}
