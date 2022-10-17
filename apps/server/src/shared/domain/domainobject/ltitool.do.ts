import { EntityId } from '@shared/domain/types';
import { LtiPrivacyPermission, LtiRoleType } from '@shared/domain/entity/ltitool.entity';
import { BaseWithTimestampsDO } from './base.do';
import { CustomLtiProperty } from '@shared/domain/domainobject/custom-lti-property';

export class LtiToolDO extends BaseWithTimestampsDO {
	name: string;

	url: string;

	key: string;

	secret: string;

	logo_url?: string;

	lti_message_type?: string;

	lti_version?: string;

	resource_link_id?: string;

	roles: LtiRoleType[];

	privacy_permission: LtiPrivacyPermission;

	customs: CustomLtiProperty[];

	isTemplate: boolean;

	isLocal?: boolean;

	originToolId?: EntityId;

	oAuthClientId?: string;

	friendlyUrl?: string;

	skipConsent?: boolean;

	openNewTab: boolean;

	frontchannel_logout_uri?: string;

	isHidden: boolean;

	constructor(props: LtiToolDO) {
		super(props);
		this.name = props.name;
		this.url = props.url;
		this.key = props.key;
		this.secret = props.secret;
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
