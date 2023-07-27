import { TokenEndpointAuthMethod } from '@src/modules/tool/common/interface';
import { ExternalToolConfigDO } from './external-tool-config.do';
import { ToolConfigType } from './tool-config-type.enum';

export class Oauth2ToolConfigDO extends ExternalToolConfigDO {
	clientId: string;

	clientSecret?: string;

	skipConsent: boolean;

	tokenEndpointAuthMethod?: TokenEndpointAuthMethod;

	frontchannelLogoutUri?: string;

	scope?: string;

	redirectUris?: string[];

	constructor(props: Oauth2ToolConfigDO) {
		super({
			type: ToolConfigType.OAUTH2,
			baseUrl: props.baseUrl,
		});
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.skipConsent = props.skipConsent;
		this.redirectUris = props.redirectUris;
		this.scope = props.scope;
		this.tokenEndpointAuthMethod = props.tokenEndpointAuthMethod;
		this.frontchannelLogoutUri = props.frontchannelLogoutUri;
	}
}
