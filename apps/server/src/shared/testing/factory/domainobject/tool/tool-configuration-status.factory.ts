import { ToolConfigurationStatus } from '@modules/tool/common/domain';

import { DoBaseFactory } from '../do-base.factory';

export const toolConfigurationStatusFactory = DoBaseFactory.define<ToolConfigurationStatus, ToolConfigurationStatus>(
	ToolConfigurationStatus,
	() => {
		return {
			isDisabled: false,
			isOutdatedOnScopeContext: false,
			isOutdatedOnScopeSchool: false,
		};
	}
);
