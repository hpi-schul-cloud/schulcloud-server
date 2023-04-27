import {
	BasicToolConfigDO,
	CustomParameterDO,
	ExternalToolDO,
	Lti11ToolConfigDO,
	Oauth2ToolConfigDO,
} from '@shared/domain/domainobject/tool';

export type ExternalTool = ExternalToolDO;

export type UpdateExternalTool = Partial<ExternalToolDO>;

export type CreateExternalTool = ExternalToolDO;

export type Lti11ToolConfig = Lti11ToolConfigDO;

export type BasicToolConfig = BasicToolConfigDO;

export type Oauth2ToolConfig = Oauth2ToolConfigDO;

export type CustomParameter = CustomParameterDO;
