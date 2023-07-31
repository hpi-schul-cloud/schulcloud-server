import { BasicToolConfig, Lti11ToolConfig, Oauth2ToolConfig } from '../../domain';
import { CustomParameter } from '../../../common/domain';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type BasicToolConfig = BasicToolConfig;

export type Lti11ToolConfigCreate = Lti11ToolConfig;

export type Lti11ToolConfigUpdate = PartialBy<Lti11ToolConfig, 'secret'>;

export type Oauth2ToolConfigCreate = Oauth2ToolConfig;

export type Oauth2ToolConfigUpdate = PartialBy<Oauth2ToolConfig, 'clientSecret'>;

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
