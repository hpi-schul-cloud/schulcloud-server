import { TokenEndpointAuthMethod, ToolConfigType } from '../../../common/enum';
import { ExternalToolConfig } from './external-tool-config.do';

export class Oauth2ToolConfig extends ExternalToolConfig {
	public clientId: string;

	public clientSecret?: string;

	public skipConsent: boolean;

	public tokenEndpointAuthMethod?: TokenEndpointAuthMethod;

	public frontchannelLogoutUri?: string;

	public scope?: string;

	public redirectUris?: string[];

	constructor(props: Omit<Oauth2ToolConfig, 'type'>) {
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
