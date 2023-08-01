import { Configuration } from '@hpi-schul-cloud/commons/lib';

export const ToolFeatures = Symbol('ToolFeatures');

export interface IToolFeatures {
	ctlToolsTabEnabled: boolean;
	ltiToolsTabEnabled: boolean;
}

export default class ToolConfiguration {
	static toolFeatures: IToolFeatures = {
		ctlToolsTabEnabled: Configuration.get('FEATURE_CTL_TOOLS_TAB_ENABLED') as boolean,
		ltiToolsTabEnabled: Configuration.get('FEATURE_LTI_TOOLS_TAB_ENABLED') as boolean,
	};
}
