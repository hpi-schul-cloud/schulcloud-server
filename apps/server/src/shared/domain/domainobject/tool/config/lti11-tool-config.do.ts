import { LtiMessageType, LtiPrivacyPermission } from '@shared/domain/entity';
import { ExternalToolConfigDO } from './external-tool-config.do';
import { ToolConfigType } from './tool-config-type.enum';

export class Lti11ToolConfigDO extends ExternalToolConfigDO {
	key: string;

	secret: string;

	resource_link_id?: string;

	lti_message_type: LtiMessageType;

	privacy_permission: LtiPrivacyPermission;

	constructor(props: Lti11ToolConfigDO) {
		super({
			type: ToolConfigType.LTI11,
			baseUrl: props.baseUrl,
		});
		this.key = props.key;
		this.secret = props.secret;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
	}
}
