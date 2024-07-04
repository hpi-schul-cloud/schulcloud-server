import { Factory } from 'fishery';
import { SchoolExternalToolConfigurationStatus } from '../domain';

export const schoolExternalToolConfigurationStatusFactory = Factory.define<SchoolExternalToolConfigurationStatus>(
	() => {
		return {
			isOutdatedOnScopeSchool: false,
			isGloballyDeactivated: false,
		};
	}
);
