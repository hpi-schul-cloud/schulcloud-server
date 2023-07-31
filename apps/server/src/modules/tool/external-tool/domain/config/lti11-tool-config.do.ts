import { LtiMessageType, ToolConfigType, LtiPrivacyPermission } from '../../../common/enum';
import { ExternalToolConfig } from './external-tool-config.do';

export class Lti11ToolConfig extends ExternalToolConfig {
	key: string;

	secret: string;

	resource_link_id?: string;

	lti_message_type: LtiMessageType;

	privacy_permission: LtiPrivacyPermission;

	constructor(props: Lti11ToolConfig) {
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
