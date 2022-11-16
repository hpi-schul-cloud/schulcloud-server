import { CustomParameterLocation, CustomParameterScope, CustomParameterType, ToolConfigType } from '@shared/domain';
import { LtiMessageType } from '@src/modules/tool/interface/lti-message-type.enum';
import { LtiPrivacyPermission } from '@src/modules/tool/interface/lti-privacy-permission.enum';
import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseWithTimestampsDO } from './base.do';

export class CustomParameterDO {
	name: string;

	default?: string;

	regex: string;

	scope: CustomParameterScope;

	location: CustomParameterLocation;

	type: CustomParameterType;

	constructor(props: CustomParameterDO) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}
}

export class BasicToolConfigDO {
	type: ToolConfigType;

	baseUrl: string;

	constructor(props: BasicToolConfigDO) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}
export class Lti11ToolConfigDO {
	type: ToolConfigType;

	baseUrl: string;

	key: string;

	secret: string;

	resource_link_id?: string;

	lti_message_type: LtiMessageType;

	privacy_permission: LtiPrivacyPermission;

	constructor(props: Lti11ToolConfigDO) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
		this.key = props.key;
		this.secret = props.secret;
		this.resource_link_id = props.resource_link_id;
		this.lti_message_type = props.lti_message_type;
		this.privacy_permission = props.privacy_permission;
	}
}

export class Oauth2ToolConfigDO {
	type: ToolConfigType;

	baseUrl: string;

	clientId: string;

	clientSecret: string;

	skipConsent: boolean;

	frontchannelLogoutUri?: string;

	scope?: string;

	redirectUris: string[];

	constructor(props: Oauth2ToolConfigDO) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.skipConsent = props.skipConsent;
		this.redirectUris = props.redirectUris;
		this.scope = props.scope;
		this.frontchannelLogoutUri = props.frontchannelLogoutUri;
	}
}

export class ExternalToolDO extends BaseWithTimestampsDO {
	name: string;

	url?: string;

	logoUrl?: string;

	config: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;

	parameters: CustomParameterDO[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;

	constructor(props: ExternalToolDO) {
		super(props);
		this.name = props.name;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
	}
}
