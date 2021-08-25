import { ObjectId } from '@mikro-orm/mongodb';

import { EntityId } from '@shared/domain';

import { LearnroomTestHelper } from './testHelper';
import { Course } from './course.entity';

describe('CourseEntity', () => {
	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new Course();
			expect(test).toThrow();
		});

		it('should create a course by passing right properties', () => {
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });
			expect(course instanceof Course).toEqual(true);
		});
	});

	describe('getDescriptions', () => {
		it.todo('write tests...');
	});

	describe('getStudents', () => {
		it.todo('write tests...');
	});

	describe('hasWritePermission', () => {
		it('should return false for user is not member of course', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const result = course.hasWritePermission(helper.getOtherUser() as EntityId);

			expect(result).toEqual(false);
		});

		it('should return false for existing student', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const result = course.hasWritePermission(helper.getFirstUser() as EntityId);

			expect(result).toEqual(false);
		});

		it('should return true for existing teacher', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createTeacherCourse();

			const result = course.hasWritePermission(helper.getFirstUser() as EntityId);

			expect(result).toEqual(true);
		});

		it('should return true for existing substitution teacher', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createSubstitutionCourse();

			const result = course.hasWritePermission(helper.getFirstUser() as EntityId);

			expect(result).toEqual(true);
		});
	});
});
