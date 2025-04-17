import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../common/enum';
import { ExternalToolConfig } from './external-tool-config.do';

export class Lti11ToolConfig extends ExternalToolConfig {
	public key: string;

	public secret: string;

	public lti_message_type: LtiMessageType;

	public privacy_permission: LtiPrivacyPermission;

	public launch_presentation_locale: string;

	constructor(props: Omit<Lti11ToolConfig, 'type'>) {
		super({
			type: ToolConfigType.LTI11,
			baseUrl: props.baseUrl,
		});
		this.key = props.key;
		this.secret = props.secret;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
		this.launch_presentation_locale = props.launch_presentation_locale;
	}
}
