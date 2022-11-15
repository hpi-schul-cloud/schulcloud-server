import { Embeddable, Enum, Property } from '@mikro-orm/core';
import { ExternalToolConfig } from './external-tool-config';
import { LtiMessageType } from './lti-message-type.enum';
import { LtiRole } from './lti-role.enum';
import { ToolConfigType } from './tool-config-type.enum';

@Embeddable({ discriminatorValue: ToolConfigType.LTI11 })
export class Lti11ToolConfig extends ExternalToolConfig {
	@Property()
	key: string;

	@Property()
	secret: string;

	@Property()
	resource_link_id?: string;

	@Enum()
	lti_message_type: LtiMessageType;

	@Enum()
	roles: LtiRole[];

	@Property()
	launch_presentation_locale: string;

	@Property()
	launch_presentation_document_target: string;

	constructor(props: Lti11ToolConfig) {
		super(props);
		this.type = ToolConfigType.LTI11;
		this.key = props.key;
		this.secret = props.secret;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
		this.roles = props.roles;
		this.launch_presentation_locale = props.launch_presentation_locale;
		this.launch_presentation_document_target = props.launch_presentation_document_target;
	}
}
