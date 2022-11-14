import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Lti11ToolConfigResponse extends ExternalToolConfigResponse {
	@ApiProperty()
	type: string;

	@ApiProperty()
	baseUrl: string;

	@ApiProperty()
	key: string;

	@ApiProperty()
	resource_link_id?: string;

	@ApiProperty()
	lti_message_type: LtiMessageType;

	constructor(props: Lti11ToolConfigResponse) {
		super();
		this.type = ToolConfigType.LTI11;
		this.baseUrl = props.baseUrl;
		this.key = props.key;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
	}
}
