import { ToolConfigurationStatusResponse } from '@modules/tool/context-external-tool/controller/dto';
import { Factory } from 'fishery';

export const toolConfigurationStatusResponseFactory = Factory.define<ToolConfigurationStatusResponse>(() => {
	return {
		isDisabled: false,
		isOutdatedOnScopeContext: false,
		isOutdatedOnScopeSchool: false,
	};
});
