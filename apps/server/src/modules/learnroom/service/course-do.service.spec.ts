import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Group } from '@modules/group';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { groupFactory } from '@shared/testing';
import {
	Course,
	COURSE_REPO,
	CourseAlreadySynchronizedLoggableException,
	CourseNotSynchronizedLoggableException,
	CourseRepo,
} from '../domain';
import { courseFactory } from '../testing';
import { CourseDoService } from './course-do.service';
import { ro } from '@faker-js/faker';

describe(CourseDoService.name, () => {
	let module: TestingModule;
	let service: CourseDoService;

	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseDoService,
				{
					provide: COURSE_REPO,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();

		service = module.get(CourseDoService);
		courseRepo = module.get(COURSE_REPO);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		describe('when a group with the id exists', () => {
			const setup = () => {
				const course: Course = courseFactory.build();

				courseRepo.findCourseById.mockResolvedValueOnce(course);

				return {
					course,
				};
			};

			it('should return the group', async () => {
				const { course } = setup();

				const result: Course = await service.findById(course.id);

				expect(result).toEqual(course);
			});
		});

		describe('when a group with the id does not exists', () => {
			const setup = () => {
				const course: Course = courseFactory.build();

				courseRepo.findCourseById.mockImplementationOnce(() => {
					throw new NotFoundLoggableException(Course.name, { id: course.id });
				});

				return {
					course,
				};
			};

			it('should throw NotFoundLoggableException', async () => {
				const { course } = setup();

				await expect(service.findById(course.id)).rejects.toThrow(NotFoundLoggableException);
			});
		});
	});

	describe('saveAll', () => {
		const setup = () => {
			const course: Course = courseFactory.build();

			courseRepo.saveAll.mockResolvedValueOnce([course]);

			return {
				course,
			};
		};

		it('should save all courses', async () => {
			const { course } = setup();

			await service.saveAll([course]);

			expect(courseRepo.saveAll).toHaveBeenCalledWith([course]);
		});

		it('should return the saved courses', async () => {
			const { course } = setup();

			const result: Course[] = await service.saveAll([course]);

			expect(result).toEqual([course]);
		});
	});

	describe('findBySyncedGroup', () => {
		const setup = () => {
			const course: Course = courseFactory.build();
			const group: Group = groupFactory.build();

			courseRepo.findBySyncedGroup.mockResolvedValueOnce([course]);

			return {
				course,
				group,
			};
		};

		it('should return the synced courses', async () => {
			const { course, group } = setup();

			const result: Course[] = await service.findBySyncedGroup(group);

			expect(result).toEqual([course]);
		});
	});

	describe('stopSynchronization', () => {
		describe('when a course is synchronized with a group', () => {
			const setup = () => {
				const course: Course = courseFactory.build({ syncedWithGroup: new ObjectId().toHexString() });

				return {
					course,
				};
			};

			it('should save a course without a synchronized group', async () => {
				const { course } = setup();

				await service.stopSynchronization(course);

				expect(courseRepo.save).toHaveBeenCalledWith(
					new Course({
						...course.getProps(),
						syncedWithGroup: undefined,
					})
				);
			});
		});

		describe('when a course is not synchronized with a group', () => {
			const setup = () => {
				const course: Course = courseFactory.build();

				return {
					course,
				};
			};

			it('should throw an unprocessable entity exception', async () => {
				const { course } = setup();

				await expect(service.stopSynchronization(course)).rejects.toThrow(CourseNotSynchronizedLoggableException);
			});
		});
	});

	describe('startSynchronization', () => {
		describe('when a course is нот synchronized with a group', () => {
			const setup = () => {
				const course: Course = courseFactory.build();
				const group: Group = groupFactory.build();

				return {
					course,
					group,
				};
			};

			it('should save a course with a synchronized group', async () => {
				const { course, group } = setup();

				await service.startSynchronization(course, group);

				expect(courseRepo.save).toHaveBeenCalledWith(
					new Course({
						...course.getProps(),
						syncedWithGroup: group.id,
					})
				);
			});
		});

		describe('when a course is synchronized with a group', () => {
			const setup = () => {
				const course: Course = courseFactory.build({ syncedWithGroup: new ObjectId().toHexString() });
				const group: Group = groupFactory.build();

				return {
					course,
					group,
				};
			};
			it('should throw an unprocessable entity exception', async () => {
				const { course, group } = setup();

				await expect(service.startSynchronization(course, group)).rejects.toThrow(
					CourseAlreadySynchronizedLoggableException
				);
			});
		});
	});
});
