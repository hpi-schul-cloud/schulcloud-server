import { Factory } from 'fishery';
import { SchoolExternalToolConfigurationStatusResponse } from '../controller/dto/school-external-tool-configuration.response';

export const schoolExternalToolConfigurationStatusResponseFactory =
	Factory.define<SchoolExternalToolConfigurationStatusResponse>(() => {
		return {
			isOutdatedOnScopeSchool: false,
			isDeactivated: false,
		};
	});
