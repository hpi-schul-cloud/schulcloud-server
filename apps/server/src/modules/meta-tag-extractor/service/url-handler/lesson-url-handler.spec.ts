import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LessonService } from '@modules/lesson';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonEntity } from '@shared/domain/entity';
import { setupEntities } from '@testing/setup-entities';
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
		await setupEntities();
	});

	describe('getMetaData', () => {
		describe('when url fits', () => {
			it('should call lessonService with the correct id', async () => {
				const id = '671a5bdf0995ace8cbc6f899';
				const url = new URL(`https://localhost/topics/${id}`);

				await lessonUrlHandler.getMetaData(url);

				expect(lessonService.findById).toHaveBeenCalledWith(id);
			});

			it('should take the title from the lessons name', async () => {
				const id = '671a5bdf0995ace8cbc6f899';
				const url = new URL(`https://localhost/topics/${id}`);
				const lessonName = 'My lesson';
				lessonService.findById.mockResolvedValue({ name: lessonName } as LessonEntity);

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
