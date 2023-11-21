import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentProperties, ComponentType } from '@shared/domain';
import { lessonFactory, setupEntities } from '@shared/testing';
import { LessonRepo } from '../repository';
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

			await lessonService.findByCourseIds(courseIds);

			expect(lessonRepo.findAllByCourseIds).toBeCalledWith(courseIds, undefined);
		});

		it('should pass filters', async () => {
			const courseIds = ['course-1', 'course-2'];
			lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
			const filters = { hidden: false };

			await lessonService.findByCourseIds(courseIds, filters);

			expect(lessonRepo.findAllByCourseIds).toBeCalledWith(courseIds, filters);
		});
	});

	describe('findAllLessonsByUserId', () => {
		describe('when finding by userId', () => {
			const setup = () => {
				const userId = new ObjectId();
				const contentExample: ComponentProperties = {
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

				await expect(lessonService.findAllLessonsByUserId(userId.toHexString())).resolves.not.toThrow();
				expect(lessonRepo.findByUserId).toBeCalledWith(userId.toHexString());
			});

			it('should return array of lessons with userId', async () => {
				const { userId, lessons } = setup();

				const result = await lessonService.findAllLessonsByUserId(userId.toHexString());

				expect(result).toHaveLength(2);
				expect(result).toEqual(lessons);
			});
		});
	});

	describe('deleteUserDataFromTeams', () => {
		describe('when deleting by userId', () => {
			const setup = () => {
				const userId = new ObjectId();
				const contentExample: ComponentProperties = {
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

				await lessonService.deleteUserDataFromLessons(userId.toHexString());

				expect(lessonRepo.findByUserId).toBeCalledWith(userId.toHexString());
			});

			it('should update lessons without deleted user', async () => {
				const { userId } = setup();

				const result = await lessonService.deleteUserDataFromLessons(userId.toHexString());

				expect(result).toEqual(2);
			});
		});
	});
});
