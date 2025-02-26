import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { CourseGroupEntity, CourseGroupProperties } from '../repo';
import { courseEntityFactory } from './course-entity.factory';

class CourseGroupEntityFactory extends BaseFactory<CourseGroupEntity, CourseGroupProperties> {
	public studentsWithId(numberOfStudents: number): this {
		const students = userFactory.buildListWithId(numberOfStudents);
		const params: DeepPartial<CourseGroupProperties> = { students };

		return this.params(params);
	}
}

export const courseGroupEntityFactory = CourseGroupEntityFactory.define(CourseGroupEntity, ({ sequence }) => {
	return {
		name: `courseGroup #${sequence}`,
		course: courseEntityFactory.build(),
	};
});
