import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthenticationError } from '../../interface/authentication-error.enum';

export class StatelessAuthorizationParams {
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
}
