import { DeepPartial } from 'fishery';
import { Course, ICourseProperties } from '@shared/domain';
import { schoolFactory } from './school.factory';
import { BaseEntityTestFactory } from './base-entity-test.factory';
import { userFactory } from './user.factory';

const oneDay = 24 * 60 * 60 * 1000;

class CourseFactory extends BaseEntityTestFactory<Course, ICourseProperties> {
	isFinished(): this {
		const untilDate = new Date(Date.now() - oneDay);
		const params: DeepPartial<ICourseProperties> = { untilDate };

		return this.params(params);
	}

	isOpen(): this {
		const untilDate = new Date(Date.now() + oneDay);
		const params: DeepPartial<ICourseProperties> = { untilDate };

		return this.params(params);
	}

	studentsWithId(numberOfStudents: number): this {
		const students = userFactory.buildListWithId(numberOfStudents);
		const params: DeepPartial<ICourseProperties> = { students };

		return this.params(params);
	}
}

export const courseFactory = CourseFactory.define(Course, ({ sequence }) => {
	return {
		name: `course #${sequence}`,
		description: `course #${sequence} description`,
		color: '#FFFFFF',
		school: schoolFactory.build(),
	};
});
