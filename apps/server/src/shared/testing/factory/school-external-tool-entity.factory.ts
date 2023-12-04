import { SchoolExternalToolEntity, SchoolExternalToolProperties } from '@modules/tool/school-external-tool/entity';
import { BaseFactory } from '@shared/testing/factory/base.factory';
import { externalToolEntityFactory } from './external-tool-entity.factory';
import { schoolFactory } from './school.factory';

export const schoolExternalToolEntityFactory = BaseFactory.define<
	SchoolExternalToolEntity,
	SchoolExternalToolProperties
>(SchoolExternalToolEntity, () => {
	return {
		tool: externalToolEntityFactory.buildWithId(),
		school: schoolFactory.buildWithId(),
		schoolParameters: [{ name: 'schoolMockParameter', value: 'mockValue' }],
		toolVersion: 0,
	};
});
