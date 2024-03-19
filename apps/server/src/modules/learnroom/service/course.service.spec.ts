import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { Course as CourseEntity } from '@shared/domain/entity';
import { DomainName, OperationType } from '@shared/domain/types';
import { CourseRepo as LegacyCourseRepo, UserRepo } from '@shared/repo';
import { courseFactory as courseEntityFactory, groupFactory, setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { Group } from '@src/modules/group';
import { Course, COURSE_REPO, CourseRepo } from '../domain';
import { courseFactory } from '../testing';
import { CourseService } from './course.service';

describe('CourseService', () => {
	let module: TestingModule;
	let courseService: CourseService;

	let userRepo: DeepMocked<UserRepo>;
	let legacyCourseRepo: DeepMocked<LegacyCourseRepo>;
	let courseRepo: DeepMocked<CourseRepo>;

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
					provide: COURSE_REPO,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();
		legacyCourseRepo = module.get(LegacyCourseRepo);
		courseRepo = module.get(COURSE_REPO);
		courseService = module.get(CourseService);
		userRepo = module.get(UserRepo);
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

			const expectedResult = DomainOperationBuilder.build(DomainName.COURSE, OperationType.UPDATE, 3, [
				course1.id,
				course2.id,
				course3.id,
			]);

			return {
				expectedResult,
				user,
			};
		};

		it('should call courseRepo.findAllByUserId', async () => {
			const { user } = setup();
			await courseService.deleteUserDataFromCourse(user.id);
			expect(legacyCourseRepo.findAllByUserId).toBeCalledWith(user.id);
		});

		it('should update courses without deleted user', async () => {
			const { expectedResult, user } = setup();
			const result = await courseService.deleteUserDataFromCourse(user.id);
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

			await courseService.saveAll([course]);

			expect(courseRepo.saveAll).toHaveBeenCalledWith([course]);
		});

		it('should return the saved courses', async () => {
			const { course } = setup();

			const result: Course[] = await courseService.saveAll([course]);

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

			const result: Course[] = await courseService.findBySyncedGroup(group);

			expect(result).toEqual([course]);
		});
	});
});
