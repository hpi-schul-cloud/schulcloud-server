import { CourseGroup, ICourseGroupProperties } from '@shared/domain';
import { DeepPartial } from 'fishery';
import { courseFactory } from './course.factory';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { userFactory } from './user.factory';

class CourseGroupFactory extends BaseEntityTestFactory<CourseGroup, ICourseGroupProperties> {
	studentsWithId(numberOfStudents: number): this {
		const students = userFactory.buildListWithId(numberOfStudents);
		const params: DeepPartial<ICourseGroupProperties> = { students };

		return this.params(params);
	}
}

export const courseGroupFactory = CourseGroupFactory.define(CourseGroup, ({ sequence }) => {
	return {
		name: `courseGroup #${sequence}`,
		course: courseFactory.build(),
	};
});
