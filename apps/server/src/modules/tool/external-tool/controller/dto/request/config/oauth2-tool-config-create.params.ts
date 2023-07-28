import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { TokenEndpointAuthMethod, ToolConfigType } from '../../../../../common/interface';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class Oauth2ToolConfigCreateParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty()
	type!: ToolConfigType;

	@IsString()
	@ApiProperty()
	baseUrl!: string;

	@IsString()
	@ApiProperty()
	clientId!: string;

	@IsString()
	@ApiProperty()
	clientSecret!: string;

	@IsBoolean()
	@ApiProperty()
	skipConsent!: boolean;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	frontchannelLogoutUri?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional()
	scope?: string;

	@IsArray()
	@ApiProperty()
	redirectUris!: string[];

	@IsEnum(TokenEndpointAuthMethod)
	@ApiProperty()
	tokenEndpointAuthMethod!: TokenEndpointAuthMethod;
}
