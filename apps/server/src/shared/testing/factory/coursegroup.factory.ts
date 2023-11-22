import { CourseGroup, CourseGroupProperties } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';
import { userFactory } from './user.factory';

class CourseGroupFactory extends BaseFactory<CourseGroup, CourseGroupProperties> {
	studentsWithId(numberOfStudents: number): this {
		const students = userFactory.buildListWithId(numberOfStudents);
		const params: DeepPartial<CourseGroupProperties> = { students };

		return this.params(params);
	}
}

export const courseGroupFactory = CourseGroupFactory.define(CourseGroup, ({ sequence }) => {
	return {
		name: `courseGroup #${sequence}`,
		course: courseFactory.build(),
	};
});
