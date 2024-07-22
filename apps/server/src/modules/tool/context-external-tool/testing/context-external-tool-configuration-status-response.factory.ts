import { Factory } from 'fishery';
import { ContextExternalToolConfigurationStatusResponse } from '../../common/controller/dto/context-external-tool-configuration-status.response';

export const contextExternalToolConfigurationStatusResponseFactory =
	Factory.define<ContextExternalToolConfigurationStatusResponse>(() => {
		return {
			isOutdatedOnScopeContext: false,
			isOutdatedOnScopeSchool: false,
			isIncompleteOnScopeContext: false,
			isIncompleteOperationalOnScopeContext: false,
			isDeactivated: false,
			isNotLicensed: false,
		};
	});
