import { School } from '../entity/school.entity';
import { Course } from '../entity/course.entity';
import { User } from '../entity/user.entity';
import { schoolFactory } from './school.factory';

export const courseFactory = {
	build: (props?: {
		name?: string;
		description?: string;
		color?: string;
		school?: School;
		students?: User[];
		teachers?: User[];
		substitutionTeachers?: User[];
	}): Course => {
		const course = new Course({
			name: 'course #1',
			description: 'course #1 description',
			color: '#FFFFFF',
			school: schoolFactory.build(),
			...(props || {}),
		});
		return course;
	},
};
