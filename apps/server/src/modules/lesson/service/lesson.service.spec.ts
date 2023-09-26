import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { LessonRepo } from '@shared/repo';
import { lessonFactory, setupEntities } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { ObjectId } from '@mikro-orm/mongodb';
import { ComponentType, IComponentProperties } from '@shared/domain';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
	let lessonService: LessonService;
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

		await setupEntities();
	});

	afterAll(async () => {
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

		await lessonService.deleteLesson(lesson);

		expect(filesStorageClientAdapterService.deleteFilesOfParent).toHaveBeenCalledWith(lesson.id);

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

	describe('findAllLessonsByUserId', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const contentExample: IComponentProperties = {
					title: 'title',
					hidden: false,
					user: userId,
					component: ComponentType.TEXT,
					content: { text: 'test of content' },
				};
				const lesson1 = lessonFactory.buildWithId({ contents: [contentExample] });
				const lesson2 = lessonFactory.buildWithId({ contents: [contentExample] });
				const lessons = [lesson1, lesson2];

				lessonRepo.findByUserId.mockResolvedValue(lessons);

				return {
					userId,
					lessons,
				};
			};

			it('should call findByCourseIds from lesson repo', async () => {
				const { userId } = setup();

				await expect(lessonService.findAllLessonsByUserId(userId)).resolves.not.toThrow();
				expect(lessonRepo.findByUserId).toBeCalledWith(userId);
			});

			it('should return array of lessons with userId', async () => {
				const { userId, lessons } = setup();

				const result = await lessonService.findAllLessonsByUserId(userId);

				expect(result).toHaveLength(2);
				expect(result).toEqual(lessons);
			});
		});
	});

	describe('deleteUserDataFromTeams', () => {
		describe('when deleting by userId', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();
				const contentExample: IComponentProperties = {
					title: 'title',
					hidden: false,
					user: userId,
					component: ComponentType.TEXT,
					content: { text: 'test of content' },
				};
				const lesson1 = lessonFactory.buildWithId({ contents: [contentExample] });
				const lesson2 = lessonFactory.buildWithId({ contents: [contentExample] });

				lessonRepo.findByUserId.mockResolvedValue([lesson1, lesson2]);

				return {
					userId,
				};
			};

			it('should call lessonRepo.findByUserId', async () => {
				const { userId } = setup();

				await lessonService.deleteUserDataFromLessons(userId);

				expect(lessonRepo.findByUserId).toBeCalledWith(userId);
			});

			it('should update lessons without deleted user', async () => {
				const { userId } = setup();

				const result = await lessonService.deleteUserDataFromLessons(userId);

				expect(result).toEqual(2);
			});
		});
	});
});
