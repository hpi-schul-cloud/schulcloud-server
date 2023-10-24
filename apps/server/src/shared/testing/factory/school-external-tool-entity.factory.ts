import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ISchoolExternalToolProperties, SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';
import { externalToolEntityFactory } from './external-tool-entity.factory';
import { schoolFactory } from './school.factory';

export const schoolExternalToolEntityFactory = BaseFactory.define<
	SchoolExternalToolEntity,
	ISchoolExternalToolProperties
>(SchoolExternalToolEntity, () => {
	return {
		tool: externalToolEntityFactory.buildWithId(),
		school: schoolFactory.buildWithId(),
		schoolParameters: [{ name: 'mockParamater', value: 'mockValue' }],
		toolVersion: 0,
	};
});
