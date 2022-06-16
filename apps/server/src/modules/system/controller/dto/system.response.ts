import { OauthConfigResponse } from '@src/modules/system/controller/dto/oauth-config.response';

export class SystemResponse {
	constructor(system: SystemResponse) {
		this.type = system.type;
		this.url = system.url;
		this.alias = system.alias;
		this.oauthConfig = system.oauthConfig;
	}

	type: string;

	url?: string;

	alias?: string;

	oauthConfig?: OauthConfigResponse;
}
