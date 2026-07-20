import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { FilesStorageClientAdapterService } from '@infra/files-storage-amqp-client';
import { Logger } from '@infra/logger';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { SchoolSystemOptionsEntity } from '@modules/legacy-school/entity';
import { Submission, Task } from '@modules/task/repo';
import { UserLoginMigrationEntity } from '@modules/user-login-migration/repo';
import { Test, type TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { type ComponentProperties, ComponentType, LessonEntity, LessonRepo, Material } from '../../repo';
import { lessonFactory } from '../../testing';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
	let lessonService: LessonService;
	let module: TestingModule;

	let lessonRepo: DeepMocked<LessonRepo>;
	let injectionService: DeepMocked<AuthorizationInjectionService>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

	beforeAll(async () => {
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

		module = await Test.createTestingModule({
			providers: [
				LessonService,
				AuthorizationInjectionService,
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
			],
		}).compile();
		lessonService = module.get(LessonService);

		lessonRepo = module.get(LessonRepo);
		injectionService = module.get(AuthorizationInjectionService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
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

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.getReferenceLoader(AuthorizableReferenceType.Lesson)).toEqual(lessonService);
		});
	});

	describe('findByCourseIds', () => {
		it('should call findByCourseIds from lesson repo', async () => {
			const courseIds = ['course-1', 'course-2'];
			lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);

			await lessonService.findByCourseIds(courseIds);

			expect(lessonRepo.findAllByCourseIds).toHaveBeenCalledWith(courseIds, undefined);
		});

		it('should pass filters', async () => {
			const courseIds = ['course-1', 'course-2'];
			lessonRepo.findAllByCourseIds.mockResolvedValueOnce([[], 0]);
			const filters = { hidden: false };

			await lessonService.findByCourseIds(courseIds, filters);

			expect(lessonRepo.findAllByCourseIds).toHaveBeenCalledWith(courseIds, filters);
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
				expect(lessonRepo.findByUserId).toHaveBeenCalledWith(userId.toHexString());
			});

			it('should return array of lessons with userId', async () => {
				const { userId, lessons } = setup();

				const result = await lessonService.findAllLessonsByUserId(userId.toHexString());

				expect(result).toHaveLength(2);
				expect(result).toEqual(lessons);
			});
		});
	});
});
