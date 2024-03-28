import { BaseDO } from '@shared/domain/domainobject/base.do';
import { InternalServerErrorException } from '@nestjs/common';
import { ToolVersion } from '../../common/interface';
import { Oauth2ToolConfig, BasicToolConfig, Lti11ToolConfig, ExternalToolConfig } from './config';
import { CustomParameter } from '../../common/domain';
import { ToolConfigType, ToolContextType } from '../../common/enum';
import { ExternalToolMedium } from './external-tool-medium.do';

export interface ExternalToolProps {
	id?: string;

	name: string;

	description?: string;

	url?: string;

	logoUrl?: string;

	logo?: string;

	config: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig;

	parameters?: CustomParameter[];

	isHidden: boolean;

	isDeactivated: boolean;

	openNewTab: boolean;

	version: number;

	restrictToContexts?: ToolContextType[];

	medium?: ExternalToolMedium;
}

export class ExternalTool extends BaseDO implements ToolVersion {
	name: string;

	description?: string;

	url?: string;

	logoUrl?: string;

	logo?: string;

	config: BasicToolConfig | Lti11ToolConfig | Oauth2ToolConfig;

	parameters?: CustomParameter[];

	isHidden: boolean;

	isDeactivated: boolean;

	openNewTab: boolean;

	version: number;

	restrictToContexts?: ToolContextType[];

	medium?: ExternalToolMedium;

	constructor(props: ExternalToolProps) {
		super(props.id);

		this.name = props.name;
		this.description = props.description;
		this.url = props.url;
		this.logoUrl = props.logoUrl;
		this.logo = props.logo;
		if (ExternalTool.isBasicConfig(props.config)) {
			this.config = new BasicToolConfig(props.config);
		} else if (ExternalTool.isOauth2Config(props.config)) {
			this.config = new Oauth2ToolConfig(props.config);
		} else if (ExternalTool.isLti11Config(props.config)) {
			this.config = new Lti11ToolConfig(props.config);
		} else {
			throw new InternalServerErrorException(`Unknown tool config`);
		}
		this.parameters = props.parameters;
		this.isHidden = props.isHidden;
		this.isDeactivated = props.isDeactivated;
		this.openNewTab = props.openNewTab;
		this.version = props.version;
		this.restrictToContexts = props.restrictToContexts;
		this.medium = props.medium;
	}

	getVersion(): number {
		return this.version;
	}

	static isBasicConfig(config: ExternalToolConfig): config is BasicToolConfig {
		return ToolConfigType.BASIC === config.type;
	}

	static isOauth2Config(config: ExternalToolConfig): config is Oauth2ToolConfig {
		return ToolConfigType.OAUTH2 === config.type;
	}

	static isLti11Config(config: ExternalToolConfig): config is Lti11ToolConfig {
		return ToolConfigType.LTI11 === config.type;
	}
}
