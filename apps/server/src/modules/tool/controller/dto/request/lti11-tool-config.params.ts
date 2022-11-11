import { Enum, Property } from '@mikro-orm/core';
import { ExternalToolConfigCreateParams } from '@src/modules/tool/controller/dto/request/external-tool-config.params';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiRole } from '@src/modules/tool/interface/lti-role.enum';
import { ToolConfigType } from '@src/modules/tool/interface/tool-config-type.enum';

export class Lti11ToolConfigParams extends ExternalToolConfigCreateParams {
	@Property()
	key: string;

	@Property()
	secret: string;

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

	constructor(props: Lti11ToolConfigParams) {
		super();
		this.type = ToolConfigType.LTI11;
		this.key = props.key;
		this.secret = props.secret;
		this.resource_link = props.resource_link;
		this.lti_message_type = props.lti_message_type;
		this.roles = props.roles;
		this.launch_presentation_locale = props.launch_presentation_locale;
		this.launch_presentation_document_target = props.launch_presentation_document_target;
	}
}
