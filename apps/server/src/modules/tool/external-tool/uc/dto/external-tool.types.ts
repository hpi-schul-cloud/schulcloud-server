import { CustomParameter } from '@src/modules/tool/common/domain/custom-parameter.do';
import { BasicToolConfig } from '../../domain/config/basic-tool-config.do';
import { Lti11ToolConfig } from '../../domain/config/lti11-tool-config.do';
import { Oauth2ToolConfig } from '../../domain/config/oauth2-tool-config.do';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type BasicToolConfigDto = BasicToolConfig;

export type Lti11ToolConfigCreate = Lti11ToolConfig;

export type Lti11ToolConfigUpdate = PartialBy<Lti11ToolConfig, 'secret'>;

export type Oauth2ToolConfigCreate = Oauth2ToolConfig;

export type Oauth2ToolConfigUpdate = PartialBy<Oauth2ToolConfig, 'clientSecret'>;

export type CustomParameterDto = CustomParameter;

export type ExternalToolDto<T> = {
	name: string;

	url?: string;

	logo?: string;

	logoUrl?: string;

	config: T;

	parameters?: CustomParameterDto[];

	isHidden: boolean;

	openNewTab: boolean;

	version: number;
};

export type ExternalToolCreate = ExternalToolDto<BasicToolConfigDto | Lti11ToolConfigCreate | Oauth2ToolConfigCreate>;

export type ExternalToolUpdate = ExternalToolDto<
	BasicToolConfigDto | Lti11ToolConfigUpdate | Oauth2ToolConfigUpdate
> & {
	id: string;
};
