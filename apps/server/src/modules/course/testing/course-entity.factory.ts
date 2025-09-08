import { schoolEntityFactory } from '@modules/school/testing';
import { userFactory } from '@modules/user/testing';
import { BaseFactory } from '@testing/factory/base.factory';
import { DeepPartial } from 'fishery';
import { CourseEntity, CourseProperties } from '../repo';

const oneDay = 24 * 60 * 60 * 1000;

class CourseEntityFactory extends BaseFactory<CourseEntity, CourseProperties> {
	public isFinished(): this {
		const untilDate = new Date(Date.now() - oneDay);
		const params: DeepPartial<CourseProperties> = { untilDate };

		return this.params(params);
	}

	public isOpen(): this {
		const untilDate = new Date(Date.now() + oneDay);
		const params: DeepPartial<CourseProperties> = { untilDate };

		return this.params(params);
	}

	public studentsWithId(numberOfStudents: number): this {
		const students = userFactory.buildListWithId(numberOfStudents);
		const params: DeepPartial<CourseProperties> = { students };

		return this.params(params);
	}

	public teachersWithId(numberOfTeachers: number): this {
		const teachers = userFactory.buildListWithId(numberOfTeachers);
		const params: DeepPartial<CourseProperties> = { teachers };

		return this.params(params);
	}
}

export const courseEntityFactory = CourseEntityFactory.define(CourseEntity, ({ sequence }) => {
	return {
		name: `course #${sequence}`,
		description: `course #${sequence} description`,
		color: '#FFFFFF',
		school: schoolEntityFactory.build(),
	};
});
