import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const ToolFeatures = Symbol('ToolFeatures');

export interface IToolFeatures {
	ctlToolsTabEnabled: boolean;
	ltiToolsTabEnabled: boolean;
	contextConfigurationEnabled: boolean;
	maxExternalToolLogoSizeInBytes: number;
}

export default class ToolConfiguration {
	static toolFeatures: IToolFeatures = {
		ctlToolsTabEnabled: Configuration.get('FEATURE_CTL_TOOLS_TAB_ENABLED') as boolean,
		ltiToolsTabEnabled: Configuration.get('FEATURE_LTI_TOOLS_TAB_ENABLED') as boolean,
		contextConfigurationEnabled: Configuration.get('FEATURE_CTL_CONTEXT_CONFIGURATION_ENABLED') as boolean,
		maxExternalToolLogoSizeInBytes: Configuration.get('CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES') as number,
	};
}
