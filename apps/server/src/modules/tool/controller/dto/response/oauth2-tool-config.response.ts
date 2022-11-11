import { Property } from '@mikro-orm/core';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';

export class Oauth2ToolConfigResponse extends ExternalToolConfigResponse {
	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	skipConsent: boolean;

	@Property()
	frontchannelLogoutUrl?: string;

	constructor(props: Oauth2ToolConfigResponse) {
		super();
		this.type = ToolConfigType.OAUTH2;
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUrl = props.frontchannelLogoutUrl;
	}
}
