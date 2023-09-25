import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain';
import { CourseRepo, UserRepo } from '@shared/repo';
import { courseFactory, setupEntities, userFactory } from '@shared/testing';
import { CourseCreateDto } from '../types';
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

	describe('createCourse', () => {
		it('should call createCourse from course repository', async () => {
			const courseCreateDto: CourseCreateDto = {
				name: 'new course',
				schoolId: '1234aschoolid',
			};

			await expect(courseService.createCourse(courseCreateDto)).resolves.not.toThrow();

			expect(courseRepo.createCourse).toBeCalledTimes(1);
			expect(courseRepo.createCourse).toBeCalledWith(expect.objectContaining(courseCreateDto));
		});
	});

	describe('findById', () => {
		const setup = () => {
			const courseId = 'courseId';
			courseRepo.findById.mockResolvedValueOnce({} as Course);

			return { courseId };
		};

		it('should call findById from course repository', async () => {
			const { courseId } = setup();

			await expect(courseService.findById(courseId)).resolves.not.toThrow();

			expect(courseRepo.findById).toBeCalledWith(courseId);
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

	describe('findAllByUserId', () => {
		const setup = () => {
			const userId = 'userId';
			courseRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

			return { userId };
		};

		it('should call findAllByUserId from course repository', async () => {
			const { userId } = setup();

			await expect(courseService.findAllByUserId(userId)).resolves.not.toThrow();

			expect(courseRepo.findAllByUserId).toBeCalledWith(userId);
		});
	});
});
