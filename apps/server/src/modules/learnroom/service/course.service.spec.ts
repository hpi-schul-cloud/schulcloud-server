import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Course as CourseEntity } from '@shared/domain/entity';
import { CourseRepo as LegacyCourseRepo, UserRepo } from '@shared/repo';
import { courseFactory as courseEntityFactory, setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
import { CourseService } from './course.service';

describe('CourseService', () => {
	let module: TestingModule;
	let courseService: CourseService;

	let userRepo: DeepMocked<UserRepo>;
	let eventBus: DeepMocked<EventBus>;
	let legacyCourseRepo: DeepMocked<LegacyCourseRepo>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				CourseService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: LegacyCourseRepo,
					useValue: createMock<LegacyCourseRepo>(),
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
			],
		}).compile();
		legacyCourseRepo = module.get(LegacyCourseRepo);
		courseService = module.get(CourseService);
		userRepo = module.get(UserRepo);
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
			legacyCourseRepo.findById.mockResolvedValueOnce({} as CourseEntity);

			return { courseId };
		};

		it('should call findById from course repository', async () => {
			const { courseId } = setup();

			await expect(courseService.findById(courseId)).resolves.not.toThrow();

			expect(legacyCourseRepo.findById).toBeCalledWith(courseId);
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

				userRepo.findById.mockResolvedValue(user);
				legacyCourseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);

				return {
					user,
					allCourses,
				};
			};

			it('should call courseRepo.findAllByUserId', async () => {
				const { user } = setup();

				await courseService.findAllCoursesByUserId(user.id);

				expect(legacyCourseRepo.findAllByUserId).toBeCalledWith(user.id);
			});

			it('should return array of courses with userId', async () => {
				const { user, allCourses } = setup();

				const [courses] = await courseService.findAllCoursesByUserId(user.id);

				expect(courses.length).toEqual(3);
				expect(courses).toEqual(allCourses);
			});
		});
	});

	describe('when deleting by userId', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course1 = courseEntityFactory.buildWithId({ students: [user] });
			const course2 = courseEntityFactory.buildWithId({ teachers: [user] });
			const course3 = courseEntityFactory.buildWithId({ substitutionTeachers: [user] });
			const allCourses = [course1, course2, course3];

			userRepo.findById.mockResolvedValue(user);
			legacyCourseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);

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
			expect(legacyCourseRepo.findAllByUserId).toBeCalledWith(user.id);
		});

		it('should update courses without deleted user', async () => {
			const { expectedResult, user } = setup();
			const result = await courseService.deleteUserData(user.id);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('findAllByUserId', () => {
		const setup = () => {
			const userId = 'userId';
			legacyCourseRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

			return { userId };
		};

		it('should call findAllByUserId from course repository', async () => {
			const { userId } = setup();

			await expect(courseService.findAllByUserId(userId)).resolves.not.toThrow();

			expect(legacyCourseRepo.findAllByUserId).toBeCalledWith(userId);
		});
	});

	describe('create', () => {
		const setup = () => {
			const course = courseEntityFactory.buildWithId();
			legacyCourseRepo.createCourse.mockResolvedValueOnce();

			return { course };
		};

		it('should call createCourse from course repository', async () => {
			const { course } = setup();

			await expect(courseService.create(course)).resolves.not.toThrow();

			expect(legacyCourseRepo.createCourse).toBeCalledWith(course);
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
