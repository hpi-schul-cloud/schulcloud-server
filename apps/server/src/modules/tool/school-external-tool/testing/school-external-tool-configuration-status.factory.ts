import { Factory } from 'fishery';
import { SchoolExternalToolConfigurationStatus } from '../controller/dto';

export const schoolExternalToolConfigurationStatusFactory = Factory.define<SchoolExternalToolConfigurationStatus>(
	() => {
		return {
			isOutdatedOnScopeSchool: false,
			isDeactivated: false,
		};
	}
);
