import { type CustomParameter } from '../../../common/domain';
import { type ToolContextType } from '../../../common/enum';
import {
	type BasicToolConfig,
	type ExternalToolMedium,
	type Lti11ToolConfig,
	type Oauth2ToolConfig,
} from '../../domain';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type BasicToolConfigDto = BasicToolConfig;

export type Lti11ToolConfigCreate = Lti11ToolConfig;

export type Lti11ToolConfigUpdate = PartialBy<Lti11ToolConfig, 'secret'>;

export type Oauth2ToolConfigCreate = Oauth2ToolConfig;

export type Oauth2ToolConfigUpdate = PartialBy<Oauth2ToolConfig, 'clientSecret'>;

export type CustomParameterDto = CustomParameter;

export type ExternalToolMediumDto = ExternalToolMedium;

export type ExternalToolDto<T> = {
	name: string;

	description?: string;

	url?: string;

	logo?: string;

	logoUrl?: string;

	thumbnailUrl?: string;

	config: T;

	parameters?: CustomParameterDto[];

	isHidden: boolean;

	isDeactivated: boolean;

	openNewTab: boolean;

	restrictToContexts?: ToolContextType[];

	medium?: ExternalToolMediumDto;

	isPreferred: boolean;

	iconName?: string;
};

export type ExternalToolCreate = ExternalToolDto<BasicToolConfigDto | Lti11ToolConfigCreate | Oauth2ToolConfigCreate>;

export type ExternalToolUpdate = ExternalToolDto<
	BasicToolConfigDto | Lti11ToolConfigUpdate | Oauth2ToolConfigUpdate
> & {
	id: string;
};
