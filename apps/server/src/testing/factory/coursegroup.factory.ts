// Remove the eslint-disable after fixing the import issue in EPIC-96
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { userFactory } from '@modules/user/testing';
import { CourseGroup, CourseGroupProperties } from '@shared/domain/entity';
import { DeepPartial } from 'fishery';
import { BaseFactory } from './base.factory';
import { courseFactory } from './course.factory';

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
