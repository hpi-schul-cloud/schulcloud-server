import { SchoolExternalToolConfigurationStatus } from '@modules/tool/school-external-tool/controller/dto';
import { Factory } from 'fishery';

export const schoolToolConfigurationStatusFactory = Factory.define<SchoolExternalToolConfigurationStatus>(() => {
	return {
		isOutdatedOnScopeSchool: false,
	};
});
