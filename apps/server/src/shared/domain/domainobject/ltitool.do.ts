import { BaseWithTimestampsDO } from './base.do';
import { EntityId, LTI_PRIVACY_PERMISSION, LTI_ROLE_TYPE } from '@shared/domain';

export class LtiToolDO extends BaseWithTimestampsDO {
	name: string;

	url: string;

	key: string = 'none';

	secret: string = 'none';

	logo_url?: string;

	lti_message_type?: string;

	lti_version?: string;

	resource_link_id?: string;

	roles: LTI_ROLE_TYPE[] = [];

	privacy_permission: LTI_PRIVACY_PERMISSION = LTI_PRIVACY_PERMISSION.ANONYMOUS;

	customs: Record<string, string>[];

	isTemplate: boolean = false;

	isLocal?: boolean;

	originToolId?: EntityId;

	oAuthClientId?: string;

	friendlyUrl?: string;

	skipConsent?: boolean;

	openNewTab: boolean = false;

	frontchannel_logout_uri?: string;

	isHidden: boolean = false;

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
