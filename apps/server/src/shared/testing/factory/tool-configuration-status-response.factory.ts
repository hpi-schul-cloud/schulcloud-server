import { ToolConfigurationStatusResponse } from '@modules/tool/common/controller/dto/tool-configuration-status.response';
import { Factory } from 'fishery';

export const toolConfigurationStatusResponseFactory = Factory.define<ToolConfigurationStatusResponse>(() => {
	return {
		isOutdatedOnScopeContext: false,
		isOutdatedOnScopeSchool: false,
	};
});
