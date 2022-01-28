import { IsOptional, IsString } from 'class-validator';

export class AuthorizationQuery {
	@IsString()
	@IsOptional()
	code?: string;

	@IsString()
	@IsOptional()
	error?: string;
}
