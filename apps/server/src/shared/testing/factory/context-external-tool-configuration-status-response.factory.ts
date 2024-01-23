import { ContextExternalToolConfigurationStatusResponse } from '@modules/tool/common/controller/dto/context-external-tool-configuration-status.response';
import { Factory } from 'fishery';

export const contextExternalToolConfigurationStatusResponseFactory =
	Factory.define<ContextExternalToolConfigurationStatusResponse>(() => {
		return {
			isOutdatedOnScopeContext: false,
			isOutdatedOnScopeSchool: false,
			isIncompleteOnScopeContext: false,
			isDeactivated: false,
		};
	});
