import { CustomParameterLocation, CustomParameterScope, CustomParameterType, ToolConfigType } from '@shared/domain';
import { BaseWithTimestampsDO } from './base.do';

export class CustomParameterProperty {
	name: string;

	default?: string;

	regex: string;

	scope: CustomParameterScope;

	location: CustomParameterLocation;

	type: CustomParameterType;

	constructor(props: CustomParameterProperty) {
		this.name = props.name;
		this.default = props.default;
		this.location = props.location;
		this.scope = props.scope;
		this.type = props.type;
		this.regex = props.regex;
	}
}

export class ExternalToolConfigProperty {
	type: ToolConfigType;

	baseUrl: string;

	constructor(props: ExternalToolConfigProperty) {
		this.type = props.type;
		this.baseUrl = props.baseUrl;
	}
}

export class ExternalToolDO extends BaseWithTimestampsDO {
	name: string;

	url?: string;

	logoUrl?: string;

	config: ExternalToolConfigProperty;

	parameters?: CustomParameterProperty[];

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
