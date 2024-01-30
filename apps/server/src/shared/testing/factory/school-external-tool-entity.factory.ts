import { SchoolExternalToolEntity, SchoolExternalToolProperties } from '@modules/tool/school-external-tool/entity';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { externalToolEntityFactory } from './external-tool-entity.factory';
import { schoolEntityFactory } from './school-entity.factory';
import { schoolExternalToolConfigurationStatusEntityFactory } from './school-external-tool-configuration-status-entity.factory';

export const schoolExternalToolEntityFactory = BaseFactory.define<
	SchoolExternalToolEntity,
	SchoolExternalToolProperties
>(SchoolExternalToolEntity, () => {
	return {
		tool: externalToolEntityFactory.buildWithId(),
		school: schoolEntityFactory.buildWithId(),
		schoolParameters: [{ name: 'schoolMockParameter', value: 'mockValue' }],
		toolVersion: 0,
		status: schoolExternalToolConfigurationStatusEntityFactory.build(),
	};
});
