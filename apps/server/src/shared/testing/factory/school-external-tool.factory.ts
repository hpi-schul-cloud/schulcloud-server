import { BaseFactory } from '@shared/testing/factory/base.factory';
import { SchoolExternalTool, ISchoolExternalToolProperties } from '@shared/domain';
import { externalToolFactory } from './external-tool.factory';
import { schoolFactory } from './school.factory';

export const schoolExternalToolFactory = BaseFactory.define<SchoolExternalTool, ISchoolExternalToolProperties>(
	SchoolExternalTool,
	({ sequence }) => {
		return {
			tool: externalToolFactory.buildWithId(),
			school: schoolFactory.buildWithId(),
			schoolParameters: [{ name: 'mockParamater', value: 'mockValue' }],
			toolVersion: 0,
		};
	}
);
