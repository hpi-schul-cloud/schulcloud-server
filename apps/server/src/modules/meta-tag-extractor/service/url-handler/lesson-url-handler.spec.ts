import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonEntity } from '@shared/domain';
import { setupEntities } from '@shared/testing';
import { LessonService } from '@src/modules/lesson/service';
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
		await setupEntities();
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call lessonService with the correct id', async () => {
				const id = 'af322312feae';
				const url = `https://localhost/topics/${id}`;

				await lessonUrlHandler.getMetaData(url);

				expect(lessonService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the lessons name', async () => {
				const id = 'af322312feae';
				const url = `https://localhost/topics/${id}`;
				const lessonName = 'My lesson';
				lessonService.findById.mockResolvedValue({ name: lessonName } as LessonEntity);

				const result = await lessonUrlHandler.getMetaData(url);

				expect(result).toEqual(expect.objectContaining({ title: lessonName, type: 'lesson' }));
			});
		});

		describe('when url does not fit', () => {
			it('should return undefined', async () => {
				const url = `https://localhost/invalid/ef2345abe4e3b`;

				const result = await lessonUrlHandler.getMetaData(url);

				expect(result).toBeUndefined();
			});
		});
	});
});
