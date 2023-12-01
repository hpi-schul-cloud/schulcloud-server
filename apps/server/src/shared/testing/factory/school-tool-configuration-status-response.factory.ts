import { SchoolToolConfigurationStatusResponse } from '@modules/tool/school-external-tool/controller/dto/school-external-tool-configuration.response';
import { Factory } from 'fishery';

export const schoolToolConfigurationStatusResponseFactory = Factory.define<SchoolToolConfigurationStatusResponse>(
	() => {
		return {
			isOutdatedOnScopeSchool: false,
		};
	}
);
