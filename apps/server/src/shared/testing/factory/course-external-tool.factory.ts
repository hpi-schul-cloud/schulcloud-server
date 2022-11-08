import { BaseFactory } from '@shared/testing/factory/base.factory';
import { CourseExternalTool, CustomParameterEntry, ICourseExternalToolProperties } from '@shared/domain';
import { courseFactory } from './course.factory';
import { schoolExternalToolFactory } from './school-external-tool.factory';

export const courseExternalToolFactory = BaseFactory.define<CourseExternalTool, ICourseExternalToolProperties>(
	CourseExternalTool,
	({ sequence }) => {
		return {
			schoolTool: schoolExternalToolFactory.buildWithId(),
			course: courseFactory.buildWithId(),
			courseParameters: [new CustomParameterEntry({ name: 'mockParamater', value: 'mockValue' })],
			toolVersion: 0,
		};
	}
);
