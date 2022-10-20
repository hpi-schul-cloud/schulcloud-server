import { Embeddable } from '@mikro-orm/core';
import { ExternalToolConfig } from './external-tool-config';

@Embeddable()
export class Oauth2Config extends ExternalToolConfig {
	constructor(props: Oauth2Config) {
		super(props);
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUrl = props.frontchannelLogoutUrl;
	}

	clientId: string;

	clientSecret: string;

	skipConsent: boolean;

	frontchannelLogoutUrl?: string;
}
