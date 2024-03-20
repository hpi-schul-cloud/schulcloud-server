import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { LtiPrivacyPermission } from '@shared/domain/entity/ltitool.entity';
import { LtiMessageType, ToolConfigType } from '../../../common/enum';
import { ExternalToolConfigEntity } from './external-tool-config.entity';

@Embeddable({ discriminatorValue: ToolConfigType.LTI11 })
export class Lti11ToolConfigEntity extends ExternalToolConfigEntity {
	@Property()
	key: string;

	@Property()
	secret: string;

	@Enum()
	lti_message_type: LtiMessageType;

	@Enum()
	privacy_permission: LtiPrivacyPermission;

	@Property()
	launch_presentation_locale: string;

	constructor(props: Lti11ToolConfigEntity) {
		super(props);
		this.type = ToolConfigType.LTI11;
		this.key = props.key;
		this.secret = props.secret;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
		this.launch_presentation_locale = props.launch_presentation_locale;
	}
}
