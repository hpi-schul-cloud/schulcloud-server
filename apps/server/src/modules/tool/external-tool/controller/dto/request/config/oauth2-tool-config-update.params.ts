import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { TokenEndpointAuthMethod, ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigCreateParams } from './external-tool-config.params';

export class Oauth2ToolConfigUpdateParams extends ExternalToolConfigCreateParams {
	@IsEnum(ToolConfigType)
	@ApiProperty({
		enum: ToolConfigType,
		enumName: 'ToolConfigType',
		description: 'Configuration type of the tool.',
		example: ToolConfigType.OAUTH2,
	})
	public type!: ToolConfigType;

	@IsUrl(
		{ require_protocol: true, protocols: ['https'] },
		{ message: 'baseUrl must be a URL address with https protocol' }
	)
	@ApiProperty({
		description:
			'Defines the target URL that is launched. Can be automatically filled with parameter values when using : in-front of the parameter name. Must be HTTPS.',
		example: 'https://example.com/:parameter1/test',
	})
	public baseUrl!: string;

	@IsString()
	@ApiProperty({
		description: 'OAuth2 client id.',
	})
	public clientId!: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'OAuth2 client secret.',
	})
	public clientSecret?: string;

	@IsBoolean()
	@ApiProperty({
		description: 'If true, skips the users consent request before launching the tool for the first time.',
	})
	public skipConsent!: boolean;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'OAuth2 frontchannel logout uri.',
	})
	public frontchannelLogoutUri?: string;

	@IsString()
	@IsOptional()
	@ApiPropertyOptional({
		description: 'OAuth2 scopes.',
	})
	public scope?: string;

	@IsArray()
	@ApiProperty({
		type: String,
		description: 'Allowed OAuth2 redirect uris.',
		isArray: true,
	})
	public redirectUris!: string[];

	@IsEnum(TokenEndpointAuthMethod)
	@ApiProperty({
		enum: TokenEndpointAuthMethod,
		enumName: 'TokenEndpointAuthMethod',
		description: 'OAuth2 token endpoint method',
		example: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
	})
	public tokenEndpointAuthMethod!: TokenEndpointAuthMethod;
}
