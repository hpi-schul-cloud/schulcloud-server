import { ContextExternalToolConfigurationStatus } from '@modules/tool/common/domain';
import { Factory } from 'fishery';

export const toolConfigurationStatusFactory = Factory.define<ContextExternalToolConfigurationStatus>(() => {
	return {
		isOutdatedOnScopeContext: false,
		isOutdatedOnScopeSchool: false,
		isIncompleteOnScopeContext: false,
		isIncompleteOperationalOnScopeContext: false,
		isDeactivated: false,
		isNotLicensed: false,
	};
});
