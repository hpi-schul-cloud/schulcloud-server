import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, IComponentProperties } from '@shared/domain';
import { LessonRepo } from '@shared/repo';
import { lessonFactory, setupEntities } from '@shared/testing';
import { FilesStorageClientAdapterService } from '@src/modules/files-storage-client';
import { LessonCreateDto } from '../types';
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

	it('create lesson', async () => {
		const lessonCreateDto: LessonCreateDto = {
			name: 'mySampleCourse',
			courseId: 'a_fake_course_id',
		};

		await lessonService.createLesson(lessonCreateDto);

		expect(lessonRepo.createLessonByDto).toHaveBeenCalledWith(expect.objectContaining({ name: lessonCreateDto.name }));
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
