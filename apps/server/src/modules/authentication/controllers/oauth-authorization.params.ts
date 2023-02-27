import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { OauthAuthorizationParams } from '../strategy/dtos/oauth-authorization.params';

export class OauthAuthorizationQueryParams implements OauthAuthorizationParams {
	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	code?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	error?: string;

	@IsOptional()
	@IsString()
	@ApiPropertyOptional()
	redirect?: string;
}
