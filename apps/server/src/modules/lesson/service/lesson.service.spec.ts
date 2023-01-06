import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonRepo } from '@shared/repo';
import { lessonFactory, setupEntities } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { FileRecordParentType } from '@src/modules/files-storage/entity/filerecord.entity';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
	let lessonService: LessonService;
	let orm: MikroORM;
	let module: TestingModule;

	let lessonRepo: DeepMocked<LessonRepo>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LessonService,
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();
		lessonService = module.get(LessonService);

		lessonRepo = module.get(LessonRepo);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(lessonService).toBeDefined();
	});

	it('delete lesson', async () => {
		const lesson = lessonFactory.buildWithId();
		const parentType = FileRecordParentType.Lesson;

		await lessonService.deleteLesson(lesson);

		expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith({
			schoolId: null,
			parentType,
			parentId: lesson.id,
		});

		expect(lessonRepo.delete).toHaveBeenCalledWith(lesson);
	});

	it('delete lesson', async () => {
		const lesson = lessonFactory.buildWithId();

		await lessonService.findById(lesson.id);

		expect(lessonRepo.findById).toHaveBeenCalledWith(lesson.id);
	});

	describe('findByCourseIds', () => {
		it('should call findByCourseIds from lesson repo', async () => {
			const courseIds = ['course-1', 'course-2'];
			lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);

			await expect(lessonService.findByCourseIds(courseIds)).resolves.not.toThrow();
			expect(lessonRepo.findAllByCourseIds).toBeCalledTimes(1);
			expect(lessonRepo.findAllByCourseIds).toBeCalledWith(courseIds);
		});
	});
});
