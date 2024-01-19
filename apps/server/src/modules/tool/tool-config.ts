import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const ToolFeatures = Symbol('ToolFeatures');

export interface IToolFeatures {
	ctlToolsTabEnabled: boolean;
	ltiToolsTabEnabled: boolean;
	contextConfigurationEnabled: boolean;
	// TODO N21-1337 refactor after feature flag is removed
	toolStatusWithoutVersions: boolean;
	maxExternalToolLogoSizeInBytes: number;
	backEndUrl: string;
	ctlToolsCopyEnabled: boolean;
}

export default class ToolConfiguration {
	static toolFeatures: IToolFeatures = {
		ctlToolsTabEnabled: Configuration.get('FEATURE_CTL_TOOLS_TAB_ENABLED') as boolean,
		ltiToolsTabEnabled: Configuration.get('FEATURE_LTI_TOOLS_TAB_ENABLED') as boolean,
		contextConfigurationEnabled: Configuration.get('FEATURE_CTL_CONTEXT_CONFIGURATION_ENABLED') as boolean,
		// TODO N21-1337 refactor after feature flag is removed
		toolStatusWithoutVersions: Configuration.get('FEATURE_COMPUTE_TOOL_STATUS_WITHOUT_VERSIONS_ENABLED') as boolean,
		maxExternalToolLogoSizeInBytes: Configuration.get('CTL_TOOLS__EXTERNAL_TOOL_MAX_LOGO_SIZE_IN_BYTES') as number,
		backEndUrl: Configuration.get('PUBLIC_BACKEND_URL') as string,
		ctlToolsCopyEnabled: Configuration.get('FEATURE_CTL_TOOLS_COPY_ENABLED') as boolean,
	};
}
