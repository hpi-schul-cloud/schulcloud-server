import { SchoolToolConfigurationStatus } from '@modules/tool/school-external-tool/controller/dto';
import { Factory } from 'fishery';

export const schoolToolConfigurationStatusFactory = Factory.define<SchoolToolConfigurationStatus>(() => {
	return {
		isOutdatedOnScopeSchool: false,
	};
});
