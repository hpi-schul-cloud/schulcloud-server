import { Oauth2ToolConfigDO } from './config/oauth2-tool-config.do';
import { BaseWithTimestampsDO } from '../base.do';
import { CustomParameterDO } from './custom-parameter.do';
import { BasicToolConfigDO } from './config/basic-tool-config.do';
import { Lti11ToolConfigDO } from './config/lti11-tool-config.do';

export class ExternalToolDO extends BaseWithTimestampsDO {
	id?: string;

	name: string;

	url?: string;

	logoUrl?: string;

	config: BasicToolConfigDO | Lti11ToolConfigDO | Oauth2ToolConfigDO;

	parameters?: CustomParameterDO[];

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
