import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LtiPrivacyPermission } from '@src/modules/tool/interface/lti-privacy-permission.enum';

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
