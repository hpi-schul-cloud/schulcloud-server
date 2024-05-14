import { InternalServerErrorException } from '@nestjs/common';
import { BaseDO } from '@shared/domain/domainobject/base.do';
import { CustomParameter } from '../../common/domain';
import { ToolConfigType, ToolContextType } from '../../common/enum';
import { BasicToolConfig, ExternalToolConfig, Lti11ToolConfig, Oauth2ToolConfig } from './config';
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

	restrictToContexts?: ToolContextType[];

	medium?: ExternalToolMedium;

	createdAt?: Date;
}

export class ExternalTool extends BaseDO {
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

	restrictToContexts?: ToolContextType[];

	medium?: ExternalToolMedium;

	createdAt?: Date;

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
		this.restrictToContexts = props.restrictToContexts;
		this.medium = props.medium;
		this.createdAt = props.createdAt;
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
