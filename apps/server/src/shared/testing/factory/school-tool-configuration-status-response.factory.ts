import { SchoolExternalToolConfigurationStatusResponse } from '@modules/tool/school-external-tool/controller/dto/school-external-tool-configuration.response';
import { Factory } from 'fishery';

export const schoolToolConfigurationStatusResponseFactory =
	Factory.define<SchoolExternalToolConfigurationStatusResponse>(() => {
		return {
			isOutdatedOnScopeSchool: false,
		};
	});
