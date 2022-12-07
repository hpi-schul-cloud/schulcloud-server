import { LtiRole } from '../../interface';

export class Lti11PayloadDto {
	lti_version: string;

	lti_message_type: string;

	resource_link_id: string;

	resource_link_title?: string;

	resource_link_description?: string;

	roles?: LtiRole;

	launch_presentation_document_target?: string;

	launch_presentation_locale?: string;

	launch_presentation_css_url?: string;

	launch_presentation_width?: number;

	launch_presentation_height?: number;

	launch_presentation_return_url?: string;

	user_id?: string;

	context_id?: string;

	context_type?: string;

	context_title?: string;

	context_label?: string;

	tool_consumer_info_product_family_code?: string;

	tool_consumer_info_version?: string;

	tool_consumer_instance_guid?: string;

	tool_consumer_instance_name?: string;

	tool_consumer_instance_description?: string;

	tool_consumer_instance_url?: string;

	tool_consumer_instance_contact_email?: string;

	lis_person_name_given?: string;

	lis_person_name_family?: string;

	lis_person_name_full?: string;

	lis_person_contact_email_primary?: string;

	constructor(payload: Lti11PayloadDto) {
		this.lti_version = payload.lti_version;
		this.lti_message_type = payload.lti_message_type;
		this.resource_link_id = payload.resource_link_id;
		this.resource_link_title = payload.resource_link_title;
		this.resource_link_description = payload.resource_link_description;
		this.roles = payload.roles;
		this.launch_presentation_document_target = payload.launch_presentation_document_target;
		this.launch_presentation_locale = payload.launch_presentation_locale;
		this.launch_presentation_css_url = payload.launch_presentation_css_url;
		this.launch_presentation_width = payload.launch_presentation_width;
		this.launch_presentation_height = payload.launch_presentation_height;
		this.launch_presentation_return_url = payload.launch_presentation_return_url;
		this.user_id = payload.user_id;
		this.context_id = payload.context_id;
		this.context_type = payload.context_type;
		this.context_title = payload.context_title;
		this.context_label = payload.context_label;
		this.tool_consumer_info_product_family_code = payload.tool_consumer_info_product_family_code;
		this.tool_consumer_info_version = payload.tool_consumer_info_version;
		this.tool_consumer_instance_guid = payload.tool_consumer_instance_guid;
		this.tool_consumer_instance_name = payload.tool_consumer_instance_name;
		this.tool_consumer_instance_description = payload.tool_consumer_instance_description;
		this.tool_consumer_instance_url = payload.tool_consumer_instance_url;
		this.tool_consumer_instance_contact_email = payload.tool_consumer_instance_contact_email;
		this.lis_person_name_given = payload.lis_person_name_given;
		this.lis_person_name_family = payload.lis_person_name_family;
		this.lis_person_name_full = payload.lis_person_name_full;
		this.lis_person_contact_email_primary = payload.lis_person_contact_email_primary;
	}
}
