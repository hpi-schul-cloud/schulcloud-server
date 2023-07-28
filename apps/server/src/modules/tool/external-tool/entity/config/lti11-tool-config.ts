import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { LtiPrivacyPermission } from '@shared/domain/entity/ltitool.entity';
import { ExternalToolConfig } from './external-tool-config';
import { LtiMessageType, ToolConfigType } from '../../../common/enum';

@Embeddable({ discriminatorValue: ToolConfigType.LTI11 })
export class Lti11ToolConfig extends ExternalToolConfig {
	@Property()
	key: string;

	@Property()
	secret: string;

	@Property({ nullable: true })
	resource_link_id?: string;

	@Enum()
	lti_message_type: LtiMessageType;

	@Enum()
	privacy_permission: LtiPrivacyPermission;

	constructor(props: Lti11ToolConfig) {
		super(props);
		this.type = ToolConfigType.LTI11;
		this.key = props.key;
		this.secret = props.secret;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
	}
}
