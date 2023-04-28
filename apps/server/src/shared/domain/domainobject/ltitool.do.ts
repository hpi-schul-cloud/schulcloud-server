import { EntityId } from '@shared/domain/types';
import { LtiPrivacyPermission, LtiRoleType } from '@shared/domain/entity/ltitool.entity';
import { BaseDO } from './base.do';

export class CustomLtiProperty {
	key: string;

	value: string;

	constructor(key: string, value: string) {
		this.key = key;
		this.value = value;
	}
}

export class LtiToolDO extends BaseDO {
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

	constructor(domainObject: LtiToolDO) {
		super(domainObject.id);

		this.name = domainObject.name;
		this.url = domainObject.url;
		this.key = domainObject.key;
		this.secret = domainObject.secret;
		this.logo_url = domainObject.logo_url;
		this.lti_message_type = domainObject.lti_message_type;
		this.lti_version = domainObject.lti_version;
		this.resource_link_id = domainObject.resource_link_id;
		this.roles = domainObject.roles;
		this.privacy_permission = domainObject.privacy_permission;
		this.customs = domainObject.customs;
		this.isTemplate = domainObject.isTemplate;
		this.isLocal = domainObject.isLocal;
		this.originToolId = domainObject.originToolId;
		this.oAuthClientId = domainObject.oAuthClientId;
		this.friendlyUrl = domainObject.friendlyUrl;
		this.skipConsent = domainObject.skipConsent;
		this.openNewTab = domainObject.openNewTab;
		this.frontchannel_logout_uri = domainObject.frontchannel_logout_uri;
		this.isHidden = domainObject.isHidden;
	}
}
