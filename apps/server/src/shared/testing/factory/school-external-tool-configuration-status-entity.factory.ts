import { SchoolExternalToolConfigurationStatusEntity } from '@modules/tool/school-external-tool/entity/school-external-tool-configuration-status.entity';
import { Factory } from 'fishery';

export const schoolExternalToolConfigurationStatusEntityFactory =
	Factory.define<SchoolExternalToolConfigurationStatusEntity>(() => {
		return {
			isOutdatedOnScopeSchool: false,
			isDeactivated: false,
		};
	});
