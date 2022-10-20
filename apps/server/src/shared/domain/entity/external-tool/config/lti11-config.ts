import { Embeddable } from '@mikro-orm/core';
import { ExternalToolConfig } from './external-tool-config';
import { LtiMessageType } from '../lti-message-type.enum';
import { LtiRole } from '../lti-role.enum';

@Embeddable()
export class Lti11Config extends ExternalToolConfig {
	constructor(props: Lti11Config) {
		super(props);
		this.key = props.key;
		this.secret = props.secret;
		this.resource_link = props.resource_link;
		this.lti_message_type = props.lti_message_type;
		this.roles = props.roles;
		this.launch_presentation_locale = props.launch_presentation_locale;
		this.launch_presentation_document_target = props.launch_presentation_document_target;
	}

	key: string;

	secret: string;

	resource_link?: string;

	lti_message_type: LtiMessageType;

	roles: LtiRole[];

	launch_presentation_locale: string;

	launch_presentation_document_target: string;
}
