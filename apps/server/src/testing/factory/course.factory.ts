// Remove the eslint-disables after fixing the import issue in EPIC-96
import { Course, CourseProperties } from '@shared/domain/entity';
import { DeepPartial } from 'fishery';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { schoolEntityFactory } from '@modules/school/testing';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from './base.factory';

const oneDay = 24 * 60 * 60 * 1000;

class CourseFactory extends BaseFactory<Course, CourseProperties> {
	isFinished(): this {
		const untilDate = new Date(Date.now() - oneDay);
		const params: DeepPartial<CourseProperties> = { untilDate };

		return this.params(params);
	}

	isOpen(): this {
		const untilDate = new Date(Date.now() + oneDay);
		const params: DeepPartial<CourseProperties> = { untilDate };

		return this.params(params);
	}

	studentsWithId(numberOfStudents: number): this {
		const students = userFactory.buildListWithId(numberOfStudents);
		const params: DeepPartial<CourseProperties> = { students };

		return this.params(params);
	}

	teachersWithId(numberOfTeachers: number): this {
		const teachers = userFactory.buildListWithId(numberOfTeachers);
		const params: DeepPartial<CourseProperties> = { teachers };

		return this.params(params);
	}
}

export const courseFactory = CourseFactory.define(Course, ({ sequence }) => {
	return {
		name: `course #${sequence}`,
		description: `course #${sequence} description`,
		color: '#FFFFFF',
		school: schoolEntityFactory.build(),
	};
});
