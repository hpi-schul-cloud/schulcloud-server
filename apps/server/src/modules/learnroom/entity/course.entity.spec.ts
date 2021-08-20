import { ObjectId } from '@mikro-orm/mongodb';

import { EntityId } from '@shared/domain';

import { LearnroomTestHelper } from '../utils/testHelper';

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

	/*
	describe('getDescription', () => {
		const DEFAULT_VALUE = '';

		it('should work with empty value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();
			const result = course.getDescription();

			expect(result).toEqual(DEFAULT_VALUE);
		});

		it('should work with existing value', () => {
			const description = '123';
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, description });

			const result = course.getDescription();

			expect(result).toEqual(description);
		});

		it('should work with invalid db result value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();
			// @ts-expect-error: Test case
			course.description = undefined;

			const result = course.getDescription();

			expect(result).toEqual(DEFAULT_VALUE);
		});
	});

	describe('changeDescription', () => {
		it('should change value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const newValue = '234';
			course.changeDescription(newValue);

			expect(course.description).toEqual(newValue);
		});
	});

	describe('getColor', () => {
		const DEFAULT_VALUE = '#ACACAC';

		it('should work with empty value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const result = course.getColor();

			expect(result).toEqual(DEFAULT_VALUE);
		});

		it('should work with existing value', () => {
			const color = '#FFFFFF';
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, color });

			const result = course.getColor();

			expect(result).toEqual(color);
		});

		it('should work with invalid db result value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();
			// @ts-expect-error: Test case
			course.color = undefined;

			const result = course.getColor();

			expect(result).toEqual(DEFAULT_VALUE);
		});
	});

	describe('changeColor', () => {
		it('should change value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const newValue = '234';
			course.changeColor(newValue);

			expect(course.color).toEqual(newValue);
		});
	});

	describe('getName', () => {
		it('should work with existing value', () => {
			const name = '123';
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name, schoolId });

			const result = course.getName();

			expect(result).toEqual(name);
		});

		it('should work with invalid db result value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();
			// @ts-expect-error: Test case
			course.name = undefined;

			const result = course.getName();

			const defaultValue = 'Kurse';
			expect(result).toEqual(defaultValue);
		});
	});

	describe('changeName', () => {
		it('should change value', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const newValue = '234';
			course.changeName(newValue);

			expect(course.name).toEqual(newValue);
		});
	});
	*/
	/*
	describe('isStudent', () => {
		it('should return false for user is not member of course', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });

			const result = course.isStudent(userId);

			expect(result).toEqual(false);
		});

		it('should return true for existing student', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, studentIds: [userId] });

			const result = course.isStudent(userId);

			expect(result).toEqual(true);
		});

		it('should return false for user has other roles', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, substitutionTeacherIds: [userId], teacherIds: [userId] });

			const result = course.isStudent(userId);

			expect(result).toEqual(false);
		});
	});

	describe('isTeacher', () => {
		it('should return false for user is not member of course', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });

			const result = course.isTeacher(userId);

			expect(result).toEqual(false);
		});

		it('should return true for existing student', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, teacherIds: [userId] });

			const result = course.isTeacher(userId);

			expect(result).toEqual(true);
		});

		it('should return false for user has other roles', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, substitutionTeacherIds: [userId], studentIds: [userId] });

			const result = course.isTeacher(userId);

			expect(result).toEqual(false);
		});
	});

	describe('isSubstitutionTeacher', () => {
		it('should return false for user is not member of course', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId });

			const result = course.isSubstitutionTeacher(userId);

			expect(result).toEqual(false);
		});

		it('should return true for existing student', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, substitutionTeacherIds: [userId] });

			const result = course.isSubstitutionTeacher(userId);

			expect(result).toEqual(true);
		});

		it('should return false for user has other roles', () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();
			const course = new Course({ name: '', schoolId, teacherIds: [userId], studentIds: [userId] });

			const result = course.isSubstitutionTeacher(userId);

			expect(result).toEqual(false);
		});
	});
	*/
	describe('isMember', () => {
		it('should return false for user is not member of course', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const result = course.isMember(helper.getOtherUser() as EntityId);

			expect(result).toEqual(false);
		});

		it('should return true for existing student', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();

			const result = course.isMember(helper.getFirstUser() as EntityId);

			expect(result).toEqual(true);
		});

		it('should return true for existing teacher', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createTeacherCourse();

			const result = course.isMember(helper.getFirstUser() as EntityId);

			expect(result).toEqual(true);
		});

		it('should return true for existing substitution teacher', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createSubstitutionCourse();

			const result = course.isMember(helper.getFirstUser() as EntityId);

			expect(result).toEqual(true);
		});
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

	describe('getGroups', () => {
		it('should return undefined is groups are not set over setGroupsThatMatchCourse', () => {
			const helper = new LearnroomTestHelper();
			const course = helper.createStudentCourse();
			const result = course.getGroups();
			expect(result).toBeUndefined();
		});
	});

	describe('setGroupsThatMatchCourse', () => {
		it('should add coursegroups to course', () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();

			const coursegroup1 = helper.createCoursegroup(course1);
			const coursegroup2 = helper.createCoursegroup(course1);

			course1.setGroupsThatMatchCourse([coursegroup1, coursegroup2]);

			expect(course1.getGroups()).toHaveLength(2);
		});

		it('should add only coursegroups to course where the courseId is matched', () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();
			const course2 = helper.createStudentCourse();

			const coursegroup1 = helper.createCoursegroup(course2);
			const coursegroup2 = helper.createCoursegroup(course2);

			course1.setGroupsThatMatchCourse([coursegroup1, coursegroup2]);

			expect(course1.getGroups()).toHaveLength(0);
		});

		it('should add mixing coursegroups to courses where the courseId is matched', () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();
			const course2 = helper.createStudentCourse();
			const course3 = helper.createStudentCourse();

			const coursegroup1 = helper.createCoursegroup(course1);
			const coursegroup2 = helper.createCoursegroup(course1);
			const coursegroup3 = helper.createCoursegroup(course2);

			const coursegroups = [coursegroup1, coursegroup2, coursegroup3];

			course1.setGroupsThatMatchCourse(coursegroups);
			course2.setGroupsThatMatchCourse(coursegroups);
			course3.setGroupsThatMatchCourse(coursegroups);

			expect(course1.getGroups()).toHaveLength(2);
			expect(course2.getGroups()).toHaveLength(1);
			expect(course3.getGroups()).toHaveLength(0);
		});
	});
});
