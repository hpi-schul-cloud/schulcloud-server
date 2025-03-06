import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenEndpointAuthMethod, ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigResponse } from './external-tool-config.response';

export class Oauth2ToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty({
		enum: ToolConfigType,
		enumName: 'ToolConfigType',
		description: 'Configuration type of the tool.',
		example: ToolConfigType.OAUTH2,
	})
	public type: ToolConfigType;

	@ApiProperty({
		description:
			'Defines the target URL that is launched. Can be automatically filled with parameter values when using : in-front of the parameter name.',
		example: 'https://example.com/:parameter1/test',
	})
	public baseUrl: string;

	@ApiProperty({
		description: 'OAuth2 client id.',
	})
	public clientId: string;

	@ApiProperty({
		description: 'If true, skips the users consent request before launching the tool for the first time.',
	})
	public skipConsent: boolean;

	@ApiPropertyOptional({
		description: 'OAuth2 frontchannel logout uri.',
	})
	public frontchannelLogoutUri?: string;

	@ApiPropertyOptional({
		description: 'OAuth2 scopes.',
	})
	public scope?: string;

	@ApiPropertyOptional({
		type: String,
		description: 'Allowed OAuth2 redirect uris.',
		isArray: true,
	})
	public redirectUris?: string[];

	@ApiPropertyOptional({
		enum: TokenEndpointAuthMethod,
		enumName: 'TokenEndpointAuthMethod',
		description: 'OAuth2 token endpoint method',
		example: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
	})
	public tokenEndpointAuthMethod?: TokenEndpointAuthMethod;

	constructor(props: Oauth2ToolConfigResponse) {
		super();
		this.type = ToolConfigType.OAUTH2;
		this.baseUrl = props.baseUrl;
		this.clientId = props.clientId;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUri = props.frontchannelLogoutUri;
		this.scope = props.scope;
		this.redirectUris = props.redirectUris;
		this.tokenEndpointAuthMethod = props.tokenEndpointAuthMethod;
	}
}
