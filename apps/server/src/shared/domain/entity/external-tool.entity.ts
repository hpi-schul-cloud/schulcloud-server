import { BaseEntityWithTimestamps } from '@shared/domain';

export enum ToolConfigType {
	BASIC = 'basic',
	OAUTH2 = 'oauth2',
	LTI11 = 'lti11',
}

export enum LtiMessageType {}

export enum LtiRole {}

export abstract class ExternalToolConfig {
	constructor(props: ExternalToolConfig) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}

	type: ToolConfigType;

	baseUrl: string;
}

export class BasicConfig extends ExternalToolConfig {}

export class Oauth2Config extends ExternalToolConfig {
	constructor(props: Oauth2Config) {
		super(props);
		this.clientId = props.clientId;
		this.clientSecret = props.clientSecret;
		this.skipConsent = props.skipConsent;
		this.frontchannelLogoutUrl = props.frontchannelLogoutUrl;
	}

	clientId: string;

	clientSecret: string;

	skipConsent: boolean;

	frontchannelLogoutUrl: string;
}

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

export enum CustomParameterScope {
	SCHOOL = 'school',
	COURSE = 'course',
}

export enum CustomParameterLocation {
	PATH = 'path',
	TOKEN = 'token',
	QUERY = 'query',
}

export enum CustomParameterType {
	STRING = 'string',
	NUMBER = 'number',
	BOOLEAN = 'boolean',
	AUTO_COURSEID = 'auto_courseid',
	AUTO_COURSENAME = 'auto_coursename',
	AUTO_SCHOOLID = 'auto_schoolid',
}

export class CustomParameter {
	constructor(props: CustomParameter) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}

	name: string;

	default: string;

	regex: string;

	scope: CustomParameterScope;

	location: CustomParameterLocation;

	type: CustomParameterType;
}

export interface IExternalToolProperties {
	name: string;
	url?: string;
	logoUrl?: string;
	config: ExternalToolConfig;
	parameters?: CustomParameter[];
	isHidden: boolean;
	openNewTab: boolean;
	version?: number;
}

export class ExternalTool extends BaseEntityWithTimestamps {
	constructor(props: IExternalToolProperties) {
		super();
		this.name = props.name;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
	}

	name: string;

	url?: string;

	logoUrl?: string;

	config: ExternalToolConfig;

	parameters?: CustomParameter[];

	isHidden: boolean;

	openNewTab: boolean;

	version?: number;
}
