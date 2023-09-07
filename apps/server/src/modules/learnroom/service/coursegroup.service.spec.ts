import { Test, TestingModule } from '@nestjs/testing';
import { CourseGroupRepo } from '@shared/repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { courseFactory, courseGroupFactory, userDoFactory } from '@shared/testing';
import { CourseGroupService } from './coursegroup.service';
import { EntityId, UserDO } from '@shared/domain';
import { InternalServerErrorException } from '@nestjs/common';

describe('CourseGroupService', () => {
	let module: TestingModule;
	let courseGroupRepo: DeepMocked<CourseGroupRepo>;
	let courseGroupService: CourseGroupService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseGroupService,
				{
					provide: CourseGroupRepo,
					useValue: createMock<CourseGroupRepo>(),
				},
			],
		}).compile();
		courseGroupRepo = module.get(CourseGroupRepo);
		courseGroupService = module.get(CourseGroupService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		courseGroupRepo.findById.mockClear();
	});

	describe('when deleting by userId', () => {
		describe('when user is missing', () => {
			it('should throw an error', async () => {
				const user: UserDO = userDoFactory.build({ id: undefined });
				const userId = user.id as EntityId;

				await expect(courseGroupService.deleteUserDataFromCourseGroup(userId)).rejects.toThrowError(
					InternalServerErrorException
				);
			});
		});
		const setup = () => {
			// Arrange
			// const course = courseFactory.build();
			const courseGroup1 = courseGroupFactory.studentsWithId(3).build();
			const courseGroup2 = courseGroupFactory.build();
			const userId = courseGroup1.students[0].id;

			courseGroupRepo.findByUserId.mockResolvedValue([[courseGroup1, courseGroup2], 2]);

			return {
				userId,
			};
		};

		it('should call courseGroupRepo.findByUserId', async () => {
			const { userId } = setup();

			await courseGroupService.deleteUserDataFromCourseGroup(userId);

			expect(courseGroupRepo.findByUserId).toBeCalledWith(userId);
		});

		// it('should update courses without deleted user', () => {
		// 	const { user } = setup();

		// 	const result = courseService.deleteUserDataFromCourse(user.id);

		// 	expect(result).toEqual(4);
		// });
	});
});
