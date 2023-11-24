import { ToolConfigurationStatusResponse } from '@modules/tool/context-external-tool/controller/dto';
import { DoBaseFactory } from './domainobject';

export const toolConfigurationStatusResponseFactory = DoBaseFactory.define<
	ToolConfigurationStatusResponse,
	ToolConfigurationStatusResponse
>(ToolConfigurationStatusResponse, () => {
	return {
		isDisabled: false,
		isOutdatedOnScopeContext: false,
		isOutdatedOnScopeSchool: false,
	};
});
