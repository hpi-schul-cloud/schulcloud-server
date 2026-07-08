import { Factory } from 'fishery';
import { type SchoolExternalToolConfigurationStatus } from '../domain';

export const schoolExternalToolConfigurationStatusFactory = Factory.define<SchoolExternalToolConfigurationStatus>(
	() => {
		return {
			isOutdatedOnScopeSchool: false,
			isGloballyDeactivated: false,
		};
	}
);
