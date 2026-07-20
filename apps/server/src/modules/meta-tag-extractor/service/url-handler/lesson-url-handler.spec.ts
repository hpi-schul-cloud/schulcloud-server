import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { LessonService } from '@modules/lesson';
import { LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { Submission, Task } from '@modules/task/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { MetaDataEntityType } from '../../types';
import { LessonUrlHandler } from './lesson-url-handler';

describe(LessonUrlHandler.name, () => {
	let module: TestingModule;
	let lessonService: DeepMocked<LessonService>;
	let lessonUrlHandler: LessonUrlHandler;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LessonUrlHandler,
				{
					provide: LessonService,
					useValue: createMock<LessonService>(),
				},
			],
		}).compile();

		lessonService = module.get(LessonService);
		lessonUrlHandler = module.get(LessonUrlHandler);
		await setupEntities([
			CourseEntity,
			CourseGroupEntity,
			LessonEntity,
			Material,
			SchoolSystemOptionsEntity,
			Submission,
			Task,
			UserLoginMigrationEntity,
		]);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call lessonService with the correct id', async () => {
				const id = new ObjectId().toHexString();
				const url = new URL(`https://localhost/topics/${id}`);

				await lessonUrlHandler.getMetaData(url);

				expect(lessonService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the lessons name', async () => {
				const lessonName = 'My lesson';

				const lesson = lessonFactory.buildWithId({ name: lessonName });
				const url = new URL(`https://localhost/topics/${lesson.id}`);
				lessonService.findById.mockResolvedValue(lesson);

				const result = await lessonUrlHandler.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ title: lessonName, type: MetaDataEntityType.LESSON }));
			});
		});

		describe('when url does not fit', () => {
			it('should return undefined', async () => {
				const url = new URL(`https://localhost/invalid/ef2345abe4e3b`);

				const result = await lessonUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
