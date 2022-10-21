import { EntityId, LtiPrivacyPermission, LtiRoleType } from '@shared/domain';
import { CustomLtiProperty } from '@shared/domain/domainobject/custom-lti-property';
import { ApiProperty } from '@nestjs/swagger';

export class LtiToolResponse {
	@ApiProperty()
	id: string;

	/**
	 * Will be return for the old clients. The new model and ui will not have this property.
	 */
	@ApiProperty()
	_id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	url: string;

	@ApiProperty()
	key: string;

	@ApiProperty()
	logo_url?: string;

	@ApiProperty()
	lti_message_type?: string;

	@ApiProperty()
	lti_version?: string;

	@ApiProperty()
	resource_link_id?: string;

	@ApiProperty()
	roles: LtiRoleType[];

	@ApiProperty()
	privacy_permission: LtiPrivacyPermission;

	@ApiProperty()
	customs: CustomLtiProperty[];

	@ApiProperty()
	isTemplate: boolean;

	@ApiProperty()
	isLocal?: boolean;

	@ApiProperty()
	originToolId?: EntityId;

	@ApiProperty()
	oAuthClientId?: string;

	@ApiProperty()
	friendlyUrl?: string;

	@ApiProperty()
	skipConsent?: boolean;

	@ApiProperty()
	openNewTab: boolean;

	@ApiProperty()
	frontchannel_logout_uri?: string;

	@ApiProperty()
	isHidden: boolean;

	constructor(props: LtiToolResponse) {
		this.id = props.id;
		this._id = props._id;
		this.name = props.name;
		this.url = props.url;
		this.key = props.key;
		this.logo_url = props.logo_url;
		this.lti_message_type = props.lti_message_type;
		this.lti_version = props.lti_version;
		this.resource_link_id = props.resource_link_id;
		this.roles = props.roles;
		this.privacy_permission = props.privacy_permission;
		this.customs = props.customs;
		this.isTemplate = props.isTemplate;
		this.isLocal = props.isLocal;
		this.originToolId = props.originToolId;
		this.oAuthClientId = props.oAuthClientId;
		this.friendlyUrl = props.friendlyUrl;
		this.skipConsent = props.skipConsent;
		this.openNewTab = props.openNewTab;
		this.frontchannel_logout_uri = props.frontchannel_logout_uri;
		this.isHidden = props.isHidden;
	}
}
