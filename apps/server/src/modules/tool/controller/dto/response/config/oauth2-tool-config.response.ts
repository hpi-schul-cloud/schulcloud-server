import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExternalToolConfigResponse } from './external-tool-config.response';
import { TokenEndpointAuthMethod, ToolConfigType } from '../../../../interface';

export class Oauth2ToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty()
	type: ToolConfigType;

	@ApiProperty()
	baseUrl: string;

	@ApiProperty()
	clientId: string;

	@ApiProperty()
	skipConsent: boolean;

	@ApiPropertyOptional()
	frontchannelLogoutUri?: string;

	@ApiPropertyOptional()
	scope?: string;

	@ApiPropertyOptional()
	redirectUris?: string[];

	@ApiPropertyOptional()
	tokenEndpointAuthMethod?: TokenEndpointAuthMethod;

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
