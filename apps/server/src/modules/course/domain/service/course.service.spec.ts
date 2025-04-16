import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { CourseEntity, CourseGroupEntity, CourseRepo } from '../../repo';
import { courseEntityFactory } from '../../testing';
import { CourseService } from './course.service';

describe('CourseService', () => {
	let module: TestingModule;
	let courseService: CourseService;

	let eventBus: DeepMocked<EventBus>;
	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		const orm = await setupEntities([User, CourseEntity, CourseGroupEntity]);
		module = await Test.createTestingModule({
			providers: [
				CourseService,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();
		courseRepo = module.get(CourseRepo);
		courseService = module.get(CourseService);
		eventBus = module.get(EventBus);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		const setup = () => {
			const courseId = 'courseId';
			courseRepo.findById.mockResolvedValueOnce({} as CourseEntity);

			return { courseId };
		};

		it('should call findById from course repository', async () => {
			const { courseId } = setup();

			await expect(courseService.findById(courseId)).resolves.not.toThrow();

			expect(courseRepo.findById).toBeCalledWith(courseId);
		});
	});

	describe('findAllCoursesByUserId', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course1 = courseEntityFactory.buildWithId({ students: [user] });
				const course2 = courseEntityFactory.buildWithId({ teachers: [user] });
				const course3 = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
				const allCourses = [course1, course2, course3];

				courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);

				return {
					user,
					allCourses,
				};
			};

			it('should call courseRepo.findAllByUserId', async () => {
				const { user } = setup();

				await courseService.findAllCoursesByUserId(user.id);

				expect(courseRepo.findAllByUserId).toBeCalledWith(user.id, undefined, undefined);
			});

			it('should return array of courses with userId', async () => {
				const { user, allCourses } = setup();

				const [courses] = await courseService.findAllCoursesByUserId(user.id);

				expect(courses.length).toEqual(3);
				expect(courses).toEqual(allCourses);
			});
		});
	});

	describe('deleteUserData', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course1 = courseEntityFactory.buildWithId({ students: [user] });
			const course2 = courseEntityFactory.buildWithId({ teachers: [user] });
			const course3 = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
			const allCourses = [course1, course2, course3];

			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.COURSE, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 3, [course1.id, course2.id, course3.id]),
			]);

			return {
				expectedResult,
				user,
			};
		};

		it('should call courseRepo.findAllByUserId', async () => {
			const { user } = setup();
			await courseService.deleteUserData(user.id);
			expect(courseRepo.findAllByUserId).toBeCalledWith(user.id);
		});

		it('should call repo.removeUserReference', async () => {
			const { user } = setup();
			await courseService.deleteUserData(user.id);
			expect(courseRepo.removeUserReference).toBeCalledWith(user.id);
		});

		it('should return DomainDeletionReport', async () => {
			const { expectedResult, user } = setup();
			const result = await courseService.deleteUserData(user.id);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('findAllByUserId', () => {
		const setup = () => {
			const userId = 'userId';
			courseRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

			return { userId };
		};

		it('should call findAllByUserId from course repository', async () => {
			const { userId } = setup();

			await expect(courseService.findAllByUserId(userId)).resolves.not.toThrow();

			expect(courseRepo.findAllByUserId).toBeCalledWith(userId, undefined, undefined);
		});
	});

	describe('create', () => {
		describe('when creating new Course', () => {
			const setup = () => {
				const course = courseEntityFactory.buildWithId();

				courseRepo.createCourse.mockResolvedValueOnce(course);

				return { course };
			};

			it('should call createCourse from course repository', async () => {
				const { course } = setup();

				await expect(courseService.create(course)).resolves.not.toThrow();

				expect(courseRepo.createCourse).toBeCalledWith(course);
			});
		});
	});

	describe('save', () => {
		describe('when saving Course', () => {
			const setup = () => {
				const course = courseEntityFactory.buildWithId();

				courseRepo.save.mockResolvedValueOnce();

				return { course };
			};

			it('should call save from course repository', async () => {
				const { course } = setup();

				await expect(courseService.save(course)).resolves.not.toThrow();

				expect(courseRepo.save).toBeCalledWith(course);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in courseService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(courseService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await courseService.handle({ deletionRequestId, targetRefId });

				expect(courseService.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(courseService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await courseService.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
