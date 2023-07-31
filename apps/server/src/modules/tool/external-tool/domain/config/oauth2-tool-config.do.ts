import { ExternalToolConfig } from './external-tool-config.do';
import { TokenEndpointAuthMethod, ToolConfigType } from '../../../common/enum';

export class Oauth2ToolConfig extends ExternalToolConfig {
	clientId: string;

	clientSecret?: string;

	skipConsent: boolean;

	tokenEndpointAuthMethod?: TokenEndpointAuthMethod;

	frontchannelLogoutUri?: string;

	scope?: string;

	redirectUris?: string[];

	constructor(props: Oauth2ToolConfig) {
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
