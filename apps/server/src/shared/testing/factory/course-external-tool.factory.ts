import { CourseExternalTool, CustomParameterEntry, ICourseExternalToolProperties } from '@shared/domain';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { courseFactory } from './course.factory';
import { schoolExternalToolFactory } from './school-external-tool.factory';

export const courseExternalToolFactory = BaseEntityTestFactory.define<CourseExternalTool, ICourseExternalToolProperties>(
	CourseExternalTool,
	() => {
		return {
			schoolTool: schoolExternalToolFactory.buildWithId(),
			course: courseFactory.buildWithId(),
			courseParameters: [new CustomParameterEntry({ name: 'mockParamater', value: 'mockValue' })],
			toolVersion: 0,
		};
	}
);
