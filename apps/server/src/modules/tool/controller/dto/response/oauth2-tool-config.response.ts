import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Oauth2ToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty()
	type: string;

	@ApiProperty()
	baseUrl: string;

	@ApiProperty()
	clientId: string;

	@ApiProperty()
	skipConsent: boolean;

	@ApiPropertyOptional()
	frontchannelLogoutUrl?: string;

	constructor(props: Oauth2ToolConfigResponse) {
		super();
		this.type = ToolConfigType.OAUTH2;
		this.baseUrl = props.baseUrl;
		this.clientId = props.clientId;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUrl = props.frontchannelLogoutUrl;
	}
}
