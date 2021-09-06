import { ObjectId } from '@mikro-orm/mongodb';

import { LearnroomTestHelper } from './testHelper';
import { Course } from './course.entity';

const DEFAULT = {
	color: '#ACACAC',
	name: 'Kurse',
	description: '',
};

describe('CourseEntity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Course();
			expect(test).toThrow();
		});

		it('should create a course by passing required properties', () => {
			const schoolId = new ObjectId();
			const course = new Course({ name: '', schoolId });
			expect(course instanceof Course).toEqual(true);
		});
	});

	describe('getDescriptions', () => {
		it('should return the right properties', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const result = course.getDescriptions();

			expect(result).toHaveProperty('color');
			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('description');
			expect(result).toHaveProperty('name');
			expect(Object.keys(result).length).toEqual(4);
		});

		it('should work and passing default informations if only required values exist', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const result = course.getDescriptions();

			expect(result).toEqual({
				description: DEFAULT.description,
				name: DEFAULT.name,
				color: DEFAULT.color,
				id: course.id,
			});
		});

		it('should return values if they are set', () => {
			const schoolId = new ObjectId();
			const name = 'A1';
			const color = 'FFFFFF';
			const description = 'Happy hour.';
			const course = new Course({ name, schoolId, color, description });

			const result = course.getDescriptions();

			expect(result).toEqual({
				description,
				name,
				color,
				id: course.id,
			});
		});
	});

	describe('getStudents', () => {
		it('should count the student number', () => {
			const helper = new LearnroomTestHelper();
			// add addtional user
			helper.createAndAddUser();
			const course = helper.createStudentCourse();

			const number = course.getNumberOfStudents();
			expect(number).toEqual(2);
		});

		it('should return 0 if no student is inside', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createTeacherCourse();

			const number = course.getNumberOfStudents();
			expect(number).toEqual(0);
		});
	});
});
