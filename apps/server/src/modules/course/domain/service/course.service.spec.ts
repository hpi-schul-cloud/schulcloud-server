import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CourseEntity, CourseGroupEntity, CourseRepo } from '../../repo';
import { courseEntityFactory } from '../../testing';
import { CourseService } from './course.service';

describe('CourseService', () => {
	let module: TestingModule;
	let courseService: CourseService;
	let courseRepo: DeepMocked<CourseRepo>;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);
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
					provide: UserDeletionInjectionService,
					useValue: createMock<UserDeletionInjectionService>({
						injectUserDeletionService: jest.fn(),
					}),
				},
			],
		}).compile();
		courseRepo = module.get(CourseRepo);
		courseService = module.get(CourseService);
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
});
