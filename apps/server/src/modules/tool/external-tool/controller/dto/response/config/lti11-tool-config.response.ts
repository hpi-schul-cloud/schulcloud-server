import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExternalToolConfigResponse } from './external-tool-config.response';
import { LtiMessageType, LtiPrivacyPermission, ToolConfigType } from '../../../../../common/interface';

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
		this.type = ToolConfigType.LTI11;
		this.baseUrl = props.baseUrl;
		this.key = props.key;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
	}
}
