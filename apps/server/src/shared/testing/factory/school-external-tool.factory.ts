import { BaseFactory } from '@shared/testing/factory/base.factory';
import { ISchoolExternalToolProperties, SchoolExternalTool } from '@src/modules/tool/school-external-tool/entity';
import { externalToolFactory } from './external-tool.factory';
import { schoolFactory } from './school.factory';

export const schoolExternalToolFactory = BaseFactory.define<SchoolExternalTool, ISchoolExternalToolProperties>(
	SchoolExternalTool,
	() => {
		return {
			tool: externalToolFactory.buildWithId(),
			school: schoolFactory.buildWithId(),
			schoolParameters: [{ name: 'mockParamater', value: 'mockValue' }],
			toolVersion: 0,
		};
	}
);
