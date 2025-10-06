import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
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
		await setupEntities([CourseEntity, CourseGroupEntity]);
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

	describe('findAllByUserId', () => {
		const setup = () => {
			const userId = 'userId';
			const schoolId = 'someSchoolId';
			const filter = {};
			const options = { pagination: undefined, order: undefined };
			courseRepo.findAllByUserId.mockResolvedValueOnce([[], 0]);

			return { userId, schoolId, filter, options };
		};

		it('should call findAllByUserId from course repository', async () => {
			const { userId, schoolId, filter, options } = setup();

			await expect(courseService.findAllByUserId(userId, schoolId, filter, options)).resolves.not.toThrow();

			expect(courseRepo.findAllByUserId).toBeCalledWith(userId, schoolId, filter, options);
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
