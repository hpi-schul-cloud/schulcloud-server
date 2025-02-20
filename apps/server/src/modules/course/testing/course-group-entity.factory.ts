import { BaseFactory } from '@testing/factory/base.factory';
import { userFactory } from '@testing/factory/user.factory';
import { DeepPartial } from 'fishery';
import { CourseGroup, CourseGroupProperties } from '../repo';
import { courseFactory } from './course-entity.factory';

class CourseGroupEntityFactory extends BaseFactory<CourseGroup, CourseGroupProperties> {
	public studentsWithId(numberOfStudents: number): this {
		const students = userFactory.buildListWithId(numberOfStudents);
		const params: DeepPartial<CourseGroupProperties> = { students };

		return this.params(params);
	}
}

export const courseGroupEntityFactory = CourseGroupEntityFactory.define(CourseGroup, ({ sequence }) => {
	return {
		name: `courseGroup #${sequence}`,
		course: courseFactory.build(),
	};
});
