import {
	ISchoolExternalToolProperties,
	SchoolExternalToolEntity,
} from '@src/modules/tool/school-external-tool/entity/school-external-tool.entity';
import { BaseFactory } from './base.factory';
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
