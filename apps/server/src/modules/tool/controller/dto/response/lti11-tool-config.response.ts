import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExternalToolConfigResponse } from './external-tool-config.response';
import { ToolConfigType } from '../../../interface/tool-config-type.enum';
import { LtiMessageType } from '../../../interface/lti-message-type.enum';
import { LtiPrivacyPermission } from '../../../interface/lti-privacy-permission.enum';

export class Lti11ToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty()
	type: ToolConfigType;

	@ApiProperty()
	baseUrl: string;

	@ApiProperty()
	key: string;

	@ApiPropertyOptional()
	resource_link_id?: string;

	@ApiProperty()
	lti_message_type: LtiMessageType;

	@ApiProperty()
	privacy_permission: LtiPrivacyPermission;

	constructor(props: Lti11ToolConfigResponse) {
		super();
		this.type = props.type;
		this.baseUrl = props.baseUrl;
		this.key = props.key;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
	}
}
