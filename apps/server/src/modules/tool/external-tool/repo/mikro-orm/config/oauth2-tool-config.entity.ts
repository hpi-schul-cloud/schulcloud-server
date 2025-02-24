import { Embeddable, Property } from '@mikro-orm/core';
import { ToolConfigType } from '../../../../common/enum';
import { ExternalToolConfigEntity } from './external-tool-config.entity';

@Embeddable({ discriminatorValue: ToolConfigType.OAUTH2 })
export class Oauth2ToolConfigEntity extends ExternalToolConfigEntity {
	@Property()
	clientId: string;

	@Property()
	skipConsent: boolean;

	constructor(props: Oauth2ToolConfigEntity) {
		super(props);
		this.type = ToolConfigType.OAUTH2;
		this.clientId = props.clientId;
		this.skipConsent = props.skipConsent;
	}
}
