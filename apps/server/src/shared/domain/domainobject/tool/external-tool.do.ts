import { BaseDO } from '../base.do';
import {
	Oauth2ToolConfigDO,
	BasicToolConfigDO,
	Lti11ToolConfigDO,
	ExternalToolConfigDO,
	ToolConfigType,
} from './config';
import { CustomParameterDO } from './custom-parameter.do';
import { ToolVersion } from './types';

export interface ExternalToolProps {
	id?: string;

	name: string;

	url?: string;

	logoUrl?: string;

	config: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;

	parameters?: CustomParameterDO[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;
}

export class ExternalToolDO extends BaseDO implements ToolVersion {
	name: string;

	url?: string;

	logoUrl?: string;

	config: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;

	parameters?: CustomParameterDO[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;

	constructor(props: ExternalToolProps) {
		super(props.id);

		this.name = props.name;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
	}

	getVersion(): number {
		return this.version;
	}

	static isOauth2Config(config: ExternalToolConfigDO): config is Oauth2ToolConfigDO {
		return ToolConfigType.OAUTH2 === config.type;
	}

	static isLti11Config(config: ExternalToolConfigDO): config is Lti11ToolConfigDO {
		return ToolConfigType.LTI11 === config.type;
	}
}
