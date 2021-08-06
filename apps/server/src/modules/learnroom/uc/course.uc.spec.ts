import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { Counted } from '@shared/domain';
import { CourseUC } from './course.uc';
import { Course, Coursegroup } from '../entity';

import { LearnroomTestHelper } from '../utils/testHelper';

describe('CourseUC', () => {
	let service: CourseUC;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CourseUC,
				{
					provide: 'CourseRepo',
					useValue: {
						findAllByUserId() {
							throw new Error('Please write a mock');
						},
					},
				},
				{
					provide: 'CoursegroupRepo',
					useValue: {
						findByCourses() {
							throw new Error('Please write a mock');
						},
					},
				},
			],
		}).compile();

		service = module.get(CourseUC);
	});

	describe('getCourseOfUser', () => {
		it('should work if no course for user exist.', async () => {
			const userId = new ObjectId().toHexString();

			const expectedResult = [[], 0] as Counted<Course[]>;

			const findAllByUserIdSpy = jest.spyOn(service.courseRepo, 'findAllByUserId').mockImplementation(() => {
				return Promise.resolve(expectedResult);
			});

			const findByCourseIdsSpy = jest.spyOn(service.coursegroupRepo, 'findByCourses').mockImplementation(() => {
				const result = [[], 0] as Counted<Coursegroup[]>;
				return Promise.resolve(result);
			});

			const result = await service.findCoursesWithGroupsByUserId(userId);

			expect(result).toEqual(expectedResult);

			findAllByUserIdSpy.mockRestore();
			findByCourseIdsSpy.mockRestore();
		});

		it('should return all existing courses of existing user by userId.', async () => {
			const helper = new LearnroomTestHelper();
			const courseUser = helper.createStudentCourse();
			const courseTeacher = helper.createTeacherCourse();
			const courseSubstitionTeacher = helper.createSubstitutionCourse();

			const expectedResult = [[courseUser, courseTeacher, courseSubstitionTeacher], 3] as Counted<Course[]>;

			const findAllByUserIdSpy = jest.spyOn(service.courseRepo, 'findAllByUserId').mockImplementation(() => {
				return Promise.resolve(expectedResult);
			});

			const findByCourseIdsSpy = jest.spyOn(service.coursegroupRepo, 'findByCourses').mockImplementation(() => {
				const result = [[], 0] as Counted<Coursegroup[]>;
				return Promise.resolve(result);
			});

			const result = await service.findCoursesWithGroupsByUserId(helper.userId);

			expect(result).toEqual(expectedResult);

			findAllByUserIdSpy.mockRestore();
			findByCourseIdsSpy.mockRestore();
		});

		it('should add coursegroups to course', async () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();

			const coursegroup1 = helper.createCoursegroup(course1);
			const coursegroup2 = helper.createCoursegroup(course1);

			const findAllByUserIdSpy = jest.spyOn(service.courseRepo, 'findAllByUserId').mockImplementation(() => {
				const courses = [course1];
				return Promise.resolve([courses, 1]);
			});

			const findByCourseIdsSpy = jest.spyOn(service.coursegroupRepo, 'findByCourses').mockImplementation(() => {
				const coursegroups = [coursegroup1, coursegroup2];
				return Promise.resolve([coursegroups, 2]);
			});

			const [courses, count] = await service.findCoursesWithGroupsByUserId(helper.userId);

			expect(count).toEqual(1);
			expect(courses[0].getGroups()).toHaveLength(2);

			findAllByUserIdSpy.mockRestore();
			findByCourseIdsSpy.mockRestore();
		});

		it('should not add coursegroups to course that are not part of this course', async () => {
			const helper = new LearnroomTestHelper();
			const course1 = helper.createStudentCourse();
			const course2 = helper.createStudentCourse();

			const coursegroup1 = helper.createCoursegroup(course1);
			const coursegroup2 = helper.createCoursegroup(course1);

			const findAllByUserIdSpy = jest.spyOn(service.courseRepo, 'findAllByUserId').mockImplementation(() => {
				const courses = [course1, course2];
				return Promise.resolve([courses, 2]);
			});

			const findByCourseIdsSpy = jest.spyOn(service.coursegroupRepo, 'findByCourses').mockImplementation(() => {
				const coursegroups = [coursegroup1, coursegroup2];
				return Promise.resolve([coursegroups, 2]);
			});

			const [courses, count] = await service.findCoursesWithGroupsByUserId(helper.userId);

			expect(count).toEqual(2);
			expect(courses[1].getGroups()).toHaveLength(0);

			findAllByUserIdSpy.mockRestore();
			findByCourseIdsSpy.mockRestore();
		});
	});
});
