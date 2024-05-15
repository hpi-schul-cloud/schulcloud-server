import { Factory } from 'fishery';
import { SchoolExternalToolConfigurationStatusEntity } from '../entity/school-external-tool-configuration-status.entity';

export const schoolExternalToolConfigurationStatusEntityFactory =
	Factory.define<SchoolExternalToolConfigurationStatusEntity>(() => {
		return {
			isOutdatedOnScopeSchool: false,
			isDeactivated: false,
		};
	});
