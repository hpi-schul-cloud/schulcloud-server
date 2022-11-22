import { ToolConfigType } from '@shared/domain';
import { ExternalToolConfigDO } from './external-tool-config.do';
import { TokenEndpointAuthMethod } from '../../../../../modules/tool/interface/token-endpoint-auth-method.enum';

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
