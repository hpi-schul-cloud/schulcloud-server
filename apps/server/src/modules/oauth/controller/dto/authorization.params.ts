import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthenticationError } from '../../interface/authentication-error.enum';

export class AuthorizationParams {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	code?: string;

	@IsOptional()
	@IsEnum(AuthenticationError)
	error?: AuthenticationError;

	@IsOptional()
	@IsString()
	error_description?: string;

	@IsOptional()
	@IsString()
	error_uri?: string;

	@IsString()
	@IsNotEmpty()
	state!: string;
}
