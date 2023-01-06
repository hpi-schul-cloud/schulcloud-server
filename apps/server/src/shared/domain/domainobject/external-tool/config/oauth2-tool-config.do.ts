import { ToolConfigType } from '@shared/domain';
import { TokenEndpointAuthMethod } from '@src/modules/tool/interface/token-endpoint-auth-method.enum';
import { ExternalToolConfigDO } from './external-tool-config.do';

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
