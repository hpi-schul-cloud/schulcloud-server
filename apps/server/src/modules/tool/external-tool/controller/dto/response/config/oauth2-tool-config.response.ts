import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenEndpointAuthMethod } from '@src/modules/tool/common/enum/token-endpoint-auth-method.enum';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { ExternalToolConfigResponse } from './external-tool-config.response';

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
