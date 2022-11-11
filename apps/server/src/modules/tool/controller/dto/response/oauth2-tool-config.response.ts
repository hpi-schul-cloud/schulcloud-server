import { Property } from '@mikro-orm/core';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { IsString } from 'class-validator';

export class Oauth2ToolConfigResponse extends ExternalToolConfigResponse {
	@IsString()
	@Property()
	clientId: string;

	@IsString()
	@Property()
	skipConsent: boolean;

	@IsString()
	@Property()
	frontchannelLogoutUrl?: string;

	constructor(props: Oauth2ToolConfigResponse) {
		super(props);
		this.type = ToolConfigType.OAUTH2;
		this.clientId = props.clientId;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUrl = props.frontchannelLogoutUrl;
	}
}
