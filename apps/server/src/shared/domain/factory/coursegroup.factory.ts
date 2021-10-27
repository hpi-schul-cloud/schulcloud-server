import { courseFactory } from './course.factory';
import { CourseGroup, ICourseGroupProperties } from '../entity/coursegroup.entity';
import { BaseFactory } from './base.factory';

export const courseGroupFactory = BaseFactory.define<CourseGroup, ICourseGroupProperties>(CourseGroup, () => {
	return {
		course: courseFactory.build(),
	};
});
