import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * @deprecated
 */
export class AuthorizationParams {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	code?: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	error?: string;
}
