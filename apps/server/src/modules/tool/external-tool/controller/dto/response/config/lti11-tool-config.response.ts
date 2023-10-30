import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LtiPrivacyPermission } from '@shared/domain/entity/ltitool.entity';
import { LtiMessageType } from '@src/modules/tool/common/enum/lti-message-type.enum';
import { ToolConfigType } from '@src/modules/tool/common/enum/tool-config-type.enum';
import { ExternalToolConfigResponse } from './external-tool-config.response';

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

	@ApiProperty()
	launch_presentation_locale: string;

	constructor(props: Lti11ToolConfigResponse) {
		super();
		this.type = ToolConfigType.LTI11;
		this.baseUrl = props.baseUrl;
		this.key = props.key;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
		this.launch_presentation_locale = props.launch_presentation_locale;
	}
}
