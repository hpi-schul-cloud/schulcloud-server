import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain';
import { CourseRepo } from '@shared/repo';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseService } from './course.service';

describe('CourseService', () => {
	let module: TestingModule;
	let courseRepo: DeepMocked<CourseRepo>;
	let courseService: CourseService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseService,
				{
					provide: CourseRepo,
					useValue: createMock<CourseRepo>(),
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
		courseRepo.findById.mockClear();
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
});
