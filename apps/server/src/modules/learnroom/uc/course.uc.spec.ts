import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { Counted } from '@shared/domain';
import { ValidationError } from '@shared/common';
import { CourseUC } from './course.uc';
import { Course } from '../entity';

describe('CourseUC', () => {
	let service: CourseUC;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CourseUC,
				{
					provide: 'CourseRepo',
					useValue: {
						getCourseOfUser() {
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

			const getCourseOfUserSpy = jest.spyOn(service.repo, 'getCourseOfUser').mockImplementation(() => {
				return Promise.resolve(expectedResult);
			});

			const result = await service.findAllCoursesFromUserByUserId(userId);

			expect(result).toEqual(expectedResult);

			getCourseOfUserSpy.mockRestore();
		});

		it('should return all existing courses of existing user by userId.', async () => {
			const userId = new ObjectId().toHexString();
			const schoolId = new ObjectId().toHexString();

			const courseUser = new Course({ name: 'user', schoolId, studentIds: [userId] });
			const courseTeacher = new Course({ name: 'teacher', schoolId, teacherIds: [userId] });
			const courseSubstitionTeacher = new Course({
				name: 'substition teacher',
				schoolId,
				substitutionTeacherIds: [userId],
			});

			const expectedResult = [[courseUser, courseTeacher, courseSubstitionTeacher], 3] as Counted<Course[]>;

			const getCourseOfUserSpy = jest.spyOn(service.repo, 'getCourseOfUser').mockImplementation(() => {
				return Promise.resolve(expectedResult);
			});

			const result = await service.findAllCoursesFromUserByUserId(userId);

			expect(result).toEqual(expectedResult);

			getCourseOfUserSpy.mockRestore();
		});
	});
});
