import { Embeddable, Property } from '@mikro-orm/core';
import { ExternalToolConfig } from './external-tool-config';
import { ToolConfigType } from './tool-config-type.enum';

@Embeddable({ discriminatorValue: ToolConfigType.OAUTH2 })
export class Oauth2ToolConfig extends ExternalToolConfig {
	@Property()
	clientId: string;

	@Property()
	clientSecret: string;

	@Property()
	skipConsent: boolean;

	@Property()
	frontchannelLogoutUri: string;

	constructor(props: Oauth2ToolConfig) {
		super(props);
		this.type = ToolConfigType.OAUTH2;
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUri = props.frontchannelLogoutUri;
	}
}
