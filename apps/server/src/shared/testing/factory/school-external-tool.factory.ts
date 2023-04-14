import { ISchoolExternalToolProperties, SchoolExternalTool } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { externalToolFactory } from './external-tool.factory';
import { schoolFactory } from './school.factory';

export const schoolExternalToolFactory = BaseEntityTestFactory.define<SchoolExternalTool, ISchoolExternalToolProperties>(
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
