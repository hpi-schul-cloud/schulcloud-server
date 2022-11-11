import { Enum, Property } from '@mikro-orm/core';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';
import { ExternalToolConfigResponse } from '@src/modules/tool/controller/dto/response/external-tool-config.response';

export class Lti11ToolConfigResponse extends ExternalToolConfigResponse {
	@Property()
	key: string;

	@Property()
	resource_link?: string;

	@Enum()
	lti_message_type: LtiMessageType;

	@Enum()
	roles: LtiRole[];

	@Property()
	launch_presentation_locale: string;

	@Property()
	launch_presentation_document_target: string;

	constructor(props: Lti11ToolConfigResponse) {
		super();
		this.type = ToolConfigType.LTI11;
		this.key = props.key;
		this.resource_link = props.resource_link;
		this.lti_message_type = props.lti_message_type;
		this.roles = props.roles;
		this.launch_presentation_locale = props.launch_presentation_locale;
		this.launch_presentation_document_target = props.launch_presentation_document_target;
	}
}
