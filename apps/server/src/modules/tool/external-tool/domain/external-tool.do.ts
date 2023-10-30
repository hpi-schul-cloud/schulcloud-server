import { BaseDO } from '@shared/domain/domainobject/base.do';
import { CustomParameter } from '../../common/domain/custom-parameter.do';
import { ToolConfigType } from '../../common/enum/tool-config-type.enum';
import { ToolVersion } from '../../common/interface/tool-version.interface';
import { BasicToolConfig } from './config/basic-tool-config.do';
import { ExternalToolConfig } from './config/external-tool-config.do';
import { Lti11ToolConfig } from './config/lti11-tool-config.do';
import { Oauth2ToolConfig } from './config/oauth2-tool-config.do';

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
