import { BasicToolConfigDO, Lti11ToolConfigDO, Oauth2ToolConfigDO } from '../../domain';
import { CustomParameter } from '../../../common/domain';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type BasicToolConfig = BasicToolConfigDO;

export type Lti11ToolConfigCreate = Lti11ToolConfigDO;

export type Lti11ToolConfigUpdate = PartialBy<Lti11ToolConfigDO, 'secret'>;

export type Oauth2ToolConfigCreate = Oauth2ToolConfigDO;

export type Oauth2ToolConfigUpdate = PartialBy<Oauth2ToolConfigDO, 'clientSecret'>;

export type CustomParameter = CustomParameter;

export type ExternalTool<T> = {
	name: string;

	url?: string;

	logoUrl?: string;

	config: T;

	parameters?: CustomParameter[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;
};

export type ExternalToolCreate = ExternalTool<BasicToolConfig | Lti11ToolConfigCreate | Oauth2ToolConfigCreate>;

export type ExternalToolUpdate = ExternalTool<BasicToolConfig | Lti11ToolConfigUpdate | Oauth2ToolConfigUpdate> & {
	id: string;
};
