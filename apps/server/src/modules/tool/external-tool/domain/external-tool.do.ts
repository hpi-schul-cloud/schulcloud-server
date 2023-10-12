import { BaseDO } from '@shared/domain/domainobject/base.do';
import { ToolVersion } from '../../common/interface';
import { Oauth2ToolConfig, BasicToolConfig, Lti11ToolConfig, ExternalToolConfig } from './config';
import { CustomParameter } from '../../common/domain';
import { ToolConfigType } from '../../common/enum';

export interface ExternalToolProps {
	id?: string;

	name: string;

	url?: string;

	logoUrl?: string;

	logo?: string;

	config: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig;

	parameters?: CustomParameter[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;
}

export class ExternalTool extends BaseDO implements ToolVersion {
	name: string;

	url?: string;

	logoUrl?: string;

	logo?: string;

	config: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig;

	parameters?: CustomParameter[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;

	constructor(props: ExternalToolProps) {
		super(props.id);

		this.name = props.name;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.logo = props.logo;
		this.config = props.config;
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
	}

	getVersion(): number {
		return this.version;
	}

	static isOauth2Config(config: ExternalToolConfig): config is Oauth2ToolConfig {
		return ToolConfigType.OAUTH2 === config.type;
	}

	static isLti11Config(config: ExternalToolConfig): config is Lti11ToolConfig {
		return ToolConfigType.LTI11 === config.type;
	}
}
