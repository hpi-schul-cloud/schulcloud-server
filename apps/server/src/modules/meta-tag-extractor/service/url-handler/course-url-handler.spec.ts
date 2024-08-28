import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseService } from '@modules/learnroom';
import { Test, TestingModule } from '@nestjs/testing';
import { Course } from '@shared/domain/entity';
import { setupEntities } from '@shared/testing';
import { CourseUrlHandler } from './course-url-handler';

describe(CourseUrlHandler.name, () => {
	let module: TestingModule;
	let courseService: DeepMocked<CourseService>;
	let courseUrlHandler: CourseUrlHandler;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseUrlHandler,
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
			],
		}).compile();

		courseService = module.get(CourseService);
		courseUrlHandler = module.get(CourseUrlHandler);
		await setupEntities();
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call courseService with the correct id', async () => {
				const id = 'af322312feae';
				const url = `https://localhost/course-rooms/${id}`;

				await courseUrlHandler.getMetaData(url);

				expect(courseService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the course name', async () => {
				const id = 'af322312feae';
				const url = `https://localhost/course-rooms/${id}`;
				const courseName = 'My Course';
				courseService.findById.mockResolvedValue({ name: courseName } as Course);

				const result = await courseUrlHandler.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ title: courseName, type: 'course' }));
			});
		});

		describe('when url does not fit', () => {
			it('should return undefined', async () => {
				const url = `https://localhost/invalid/ef2345abe4e3b`;

				const result = await courseUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
