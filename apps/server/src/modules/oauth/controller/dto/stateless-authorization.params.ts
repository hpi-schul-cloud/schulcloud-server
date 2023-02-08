import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SSOAuthenticationError } from '../../interface/sso-authentication-error.enum';

export class StatelessAuthorizationParams {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	code?: string;

	@IsOptional()
	@IsEnum(SSOAuthenticationError)
	error?: SSOAuthenticationError;

	@IsOptional()
	@IsString()
	error_description?: string;

	@IsOptional()
	@IsString()
	error_uri?: string;
}
