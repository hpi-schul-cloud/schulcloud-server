import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SSOAuthenticationError } from '../../interface/sso-authentication-error.enum';

/**
 * @deprecated
 */
export class AuthorizationParams {
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

	@IsString()
	@IsNotEmpty()
	state!: string;
}
