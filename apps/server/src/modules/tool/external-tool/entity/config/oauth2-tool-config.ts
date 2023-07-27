import { Embeddable, Property } from '@mikro-orm/core';
import { ExternalToolConfig } from './external-tool-config';
import { ToolConfigType } from '../../../common/interface';

@Embeddable({ discriminatorValue: ToolConfigType.OAUTH2 })
export class Oauth2ToolConfig extends ExternalToolConfig {
	@Property()
	clientId: string;

	@Property()
	skipConsent: boolean;

	constructor(props: Oauth2ToolConfig) {
		super(props);
		this.type = ToolConfigType.OAUTH2;
		this.clientId = props.clientId;
		this.skipConsent = props.skipConsent;
	}
}
