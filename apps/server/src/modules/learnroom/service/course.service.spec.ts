import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain';
import { CourseRepo, UserRepo } from '@shared/repo';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseService } from './course.service';

describe('CourseService', () => {
	let module: TestingModule;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseService: CourseService;
	let userRepo: DeepMocked<UserRepo>;

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
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
				},
			],
		}).compile();
		courseRepo = module.get(CourseRepo);
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
		it('should call findById from course repository', async () => {
			const courseId = 'courseId';
			courseRepo.findById.mockResolvedValueOnce({} as Course);

			await expect(courseService.findById(courseId)).resolves.not.toThrow();
			expect(courseRepo.findById).toBeCalledTimes(1);
			expect(courseRepo.findById).toBeCalledWith(courseId);
		});
	});

	describe('findUserDataFromCourses', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course1 = courseFactory.buildWithId({ students: [user] });
				const course2 = courseFactory.buildWithId({ teachers: [user] });
				const course3 = courseFactory.buildWithId({ substitutionTeachers: [user] });
				const allCourses = [course1, course2, course3];

				userRepo.findById.mockResolvedValue(user);
				courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);

				return {
					user,
					allCourses,
				};
			};

			it('should call courseRepo.findAllByUserId', async () => {
				const { user } = setup();

				await courseService.findUserDataFromCourses(user.id);

				expect(courseRepo.findAllByUserId).toBeCalledWith(user.id);
			});

			it('should return array of courses with userId', async () => {
				const { user, allCourses } = setup();

				const [courses] = await courseService.findUserDataFromCourses(user.id);

				expect(courses.length).toEqual(3);
				expect(courses).toEqual(allCourses);
			});
		});
	});

	describe('when deleting by userId', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const course1 = courseFactory.buildWithId({ students: [user] });
			const course2 = courseFactory.buildWithId({ teachers: [user] });
			const course3 = courseFactory.buildWithId({ substitutionTeachers: [user] });
			const allCourses = [course1, course2, course3];

			userRepo.findById.mockResolvedValue(user);
			courseRepo.findAllByUserId.mockResolvedValue([allCourses, allCourses.length]);

			return {
				user,
			};
		};

		it('should call courseRepo.findAllByUserId', async () => {
			const { user } = setup();
			await courseService.deleteUserDataFromCourse(user.id);
			expect(courseRepo.findAllByUserId).toBeCalledWith(user.id);
		});

		it('should update courses without deleted user', async () => {
			const { user } = setup();
			const result = await courseService.deleteUserDataFromCourse(user.id);
			expect(result).toEqual(3);
		});
	});
});
