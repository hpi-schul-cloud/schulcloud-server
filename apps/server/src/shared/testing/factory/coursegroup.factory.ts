import { CourseGroup, ICourseGroupProperties } from '@shared/domain';
import { courseFactory } from './course.factory';
import { BaseFactory } from './base.factory';

export const courseGroupFactory = BaseFactory.define<CourseGroup, ICourseGroupProperties>(
	CourseGroup,
	({ sequence }) => {
		return {
			name: `courseGroup #${sequence}`,
			course: courseFactory.build(),
		};
	}
);
