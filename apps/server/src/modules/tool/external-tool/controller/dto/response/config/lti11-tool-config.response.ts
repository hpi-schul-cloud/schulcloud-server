import { ApiProperty } from '@nestjs/swagger';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/enum';
import { ExternalToolConfigResponse } from './external-tool-config.response';

export class Lti11ToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty()
	type: ToolConfigType;

	@ApiProperty()
	baseUrl: string;

	@ApiProperty()
	key: string;

	@ApiProperty()
	lti_message_type: LtiMessageType;

	@ApiProperty()
	privacy_permission: LtiPrivacyPermission;

	@ApiProperty()
	launch_presentation_locale: string;

	constructor(props: Lti11ToolConfigResponse) {
		super();
		this.type = ToolConfigType.LTI11;
		this.baseUrl = props.baseUrl;
		this.key = props.key;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
		this.launch_presentation_locale = props.launch_presentation_locale;
	}
}
