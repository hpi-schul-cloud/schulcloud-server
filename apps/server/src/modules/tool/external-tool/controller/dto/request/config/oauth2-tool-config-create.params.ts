import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenEndpointAuthMethod } from '@src/modules/tool/common/enum/token-endpoint-auth-method.enum';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
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
