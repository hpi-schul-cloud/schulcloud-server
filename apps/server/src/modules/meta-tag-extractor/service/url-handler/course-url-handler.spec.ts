import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseService } from '@modules/course';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { Submission, Task } from '@modules/task/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { MetaDataEntityType } from '../../types';
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

		await setupEntities([CourseEntity, CourseGroupEntity, Task, Submission, LessonEntity, Material]);
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call courseService with the correct id', async () => {
				const id = new ObjectId().toHexString();
				const url = new URL(`https://localhost/course-rooms/${id}`);

				await courseUrlHandler.getMetaData(url);

				expect(courseService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the course name', async () => {
				const name = 'My Course';
				const course = courseEntityFactory.buildWithId({ name });
				const url = new URL(`https://localhost/course-rooms/${course.id}`);

				courseService.findById.mockResolvedValueOnce(course);

				const result = await courseUrlHandler.getMetaData(url);
				expect(result).toEqual(expect.objectContaining({ title: name, type: MetaDataEntityType.COURSE }));
			});
		});

		describe('when url does not fit', () => {
			it('should return undefined', async () => {
				const url = new URL(`https://localhost/invalid/ef2345abe4e3b`);

				const result = await courseUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
