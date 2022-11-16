import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { TokenEndpointAuthMethod } from '@src/modules/tool/interface/token-endpoint-auth-method.enum';

export class Oauth2ToolConfigParams extends ExternalToolConfigCreateParams {
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
