import { Property } from '@mikro-orm/core';
import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';

export class Oauth2ToolConfigParams extends ExternalToolConfigCreateParams {
	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	skipConsent: boolean;

	@Property()
	frontchannelLogoutUrl?: string;

	constructor(props: Oauth2ToolConfigParams) {
		super();
		this.type = ToolConfigType.OAUTH2;
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUrl = props.frontchannelLogoutUrl;
	}
}
