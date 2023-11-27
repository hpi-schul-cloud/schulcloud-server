import { ToolConfigurationStatus } from '@modules/tool/common/domain';
import { Factory } from 'fishery';

export const toolConfigurationStatusFactory = Factory.define<ToolConfigurationStatus>(() => {
	return {
		isDisabled: false,
		isOutdatedOnScopeContext: false,
		isOutdatedOnScopeSchool: false,
	};
});
