import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId, Counted } from '@shared/domain';
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

			const courseUser = new Course({ name: 'user', schoolId, userIds: [userId] });
			const courseTeacher = new Course({ name: 'teacher', schoolId, teacherIds: [userId] });
			const courseSubstitionTeacher = new Course({ name: 'substition teacher', schoolId, substitutionIds: [userId] });

			const expectedResult = [[courseUser, courseTeacher, courseSubstitionTeacher], 3] as Counted<Course[]>;

			const getCourseOfUserSpy = jest.spyOn(service.repo, 'getCourseOfUser').mockImplementation(() => {
				return Promise.resolve(expectedResult);
			});

			const result = await service.findAllCoursesFromUserByUserId(userId);

			expect(result).toEqual(expectedResult);

			getCourseOfUserSpy.mockRestore();
		});

		it('should throw an error by passing invalid userId.', async () => {
			const userId = '';

			const expectedResult = new ValidationError(service.err.invalidUserId, { userId });
			await expect(service.findAllCoursesFromUserByUserId(userId)).rejects.toThrow(expectedResult);
		});

		/* do no work..
		it('should pass the userId in the error details.', async () => {
			const userId = '';
			try {
				await service.findAllCoursesFromUserByUserId(userId);
				throw new Error('should throw an error');
			} catch (err) {
				const error = err as ValidationError;
				expect(error.getDetails()).toEqual({ userId });
			}
			// expect(error.details).toEqual({ userId });
			// check details as well, is not tested because it is not in the declared super class
		}); */
	});
});
