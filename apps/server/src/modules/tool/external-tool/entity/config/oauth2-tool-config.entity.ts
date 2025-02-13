import { Embeddable, Property, Index, Unique } from '@mikro-orm/core';
import { ExternalToolConfigEntity } from './external-tool-config.entity';
import { ToolConfigType } from '../../../common/enum';

@Embeddable({ discriminatorValue: ToolConfigType.OAUTH2 })
export class Oauth2ToolConfigEntity extends ExternalToolConfigEntity {
	@Index()
	@Unique({options: { sparse: true }})
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
