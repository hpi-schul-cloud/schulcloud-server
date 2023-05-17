import { BaseDO } from '../base.do';
import { Oauth2ToolConfigDO } from './config/oauth2-tool-config.do';
import { CustomParameterDO } from './custom-parameter.do';
import { BasicToolConfigDO } from './config/basic-tool-config.do';
import { Lti11ToolConfigDO } from './config/lti11-tool-config.do';

export class ExternalToolDO extends BaseDO {
	name: string;

	url?: string;

	logoUrl?: string;

	config: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;

	parameters?: CustomParameterDO[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;

	constructor(domainObject: ExternalToolDO) {
		super(domainObject.id);

		this.name = domainObject.name;
		this.url = domainObject.url;
		this.logoUrl = domainObject.logoUrl;
		this.config = domainObject.config;
		this.parameters = domainObject.parameters;
		this.isHidden = domainObject.isHidden;
		this.openNewTab = domainObject.openNewTab;
		this.version = domainObject.version;
	}
}
