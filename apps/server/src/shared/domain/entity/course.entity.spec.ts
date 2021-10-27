import { setupEntities } from '@src/modules/database';

import { userFactory, courseFactory, schoolFactory } from '../factory';

import { Course } from './course.entity';

const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

describe('CourseEntity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Course();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const course = courseFactory.build();
			expect(course instanceof Course).toEqual(true);
		});
	});

	describe('defaults', () => {
		it('should return defaults values', () => {
			const school = schoolFactory.build();
			const course = new Course({ school });

			expect(course.name).toEqual(DEFAULT.name);
			expect(course.description).toEqual(DEFAULT.description);
			expect(course.color).toEqual(DEFAULT.color);
		});
	});

	describe('getStudents', () => {
		it('should count the number of assigned students', () => {
			const student1 = userFactory.build({ firstName: 'John', lastName: 'Doe' });
			const student2 = userFactory.build({ firstName: 'Marla', lastName: 'Mathe' });
			const course = courseFactory.build({ students: [student1, student2] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(2);
		});

		it('should return 0 if no student is assigned', () => {
			const teacher = userFactory.build({ firstName: 'Carl', lastName: 'Cord' });
			const course = courseFactory.build({ teachers: [teacher], students: [] });

			const number = course.getNumberOfStudents();

			expect(number).toEqual(0);
		});
	});

	describe('isSubstitutionTeacher', () => {
		it('should return true if it is a substitution teacher', () => {
			const teacher = userFactory.build();
			// id is override in the creation process but must set otherwise it not exist
			teacher.id = '0123456789ab';
			const course = courseFactory.build({ teachers: [], substitutionTeachers: [teacher] });

			const boolean = course.isSubstitutionTeacher(teacher.id);

			expect(boolean).toBe(true);
		});

		it('should return false if it is a normal teacher', () => {
			const teacher = userFactory.build();
			// id is override in the creation process but must set otherwise it not exist
			teacher.id = '0123456789ab';
			const course = courseFactory.build({ teachers: [teacher], substitutionTeachers: [] });

			const boolean = course.isSubstitutionTeacher(teacher.id);

			expect(boolean).toBe(false);
		});

		it('should return false if it is a normal and a substitution teacher', () => {
			const teacher = userFactory.build();
			// id is override in the creation process but must set otherwise it not exist
			teacher.id = '0123456789ab';
			const course = courseFactory.build({ teachers: [teacher], substitutionTeachers: [teacher] });

			const boolean = course.isSubstitutionTeacher(teacher.id);

			expect(boolean).toBe(false);
		});

		it('should return false if it is a normal and a substitution teacher', () => {
			const teacher = userFactory.build();
			// id is override in the creation process but must set otherwise it not exist
			teacher.id = '0123456789ab';
			const course = courseFactory.build({ teachers: [], substitutionTeachers: [] });

			const boolean = course.isSubstitutionTeacher(teacher.id);

			expect(boolean).toBe(false);
		});
	});
});
