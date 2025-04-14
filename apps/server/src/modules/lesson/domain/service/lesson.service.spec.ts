import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AuthorizableReferenceType, AuthorizationInjectionService } from '@modules/authorization';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import {
	DataDeletedEvent,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { deletionRequestFactory } from '@modules/deletion/domain/testing';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Submission, Task } from '@modules/task/repo';
import { EventBus } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ComponentProperties, ComponentType, LessonEntity, LessonRepo, Material } from '../../repo';
import { lessonFactory } from '../../testing';
import { LessonService } from './lesson.service';

describe('LessonService', () => {
	let lessonService: LessonService;
	let module: TestingModule;

	let lessonRepo: DeepMocked<LessonRepo>;
	let injectionService: DeepMocked<AuthorizationInjectionService>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;
	let eventBus: DeepMocked<EventBus>;

	beforeAll(async () => {
		const orm = await setupEntities([CourseEntity, CourseGroupEntity, Task, Submission, LessonEntity, Material]);

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
				{
					provide: EventBus,
					useValue: {
						publish: jest.fn(),
					},
				},
				{
					provide: MikroORM,
					useValue: orm,
				},
			],
		}).compile();
		lessonService = module.get(LessonService);

		lessonRepo = module.get(LessonRepo);
		injectionService = module.get(AuthorizationInjectionService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
		eventBus = module.get(EventBus);
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

	describe('deleteUserData', () => {
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
				lessonRepo.removeUserReference.mockResolvedValue(2);

				const expectedResult = DomainDeletionReportBuilder.build(DomainName.LESSONS, [
					DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [lesson1.id, lesson2.id]),
				]);

				return {
					expectedResult,
					userId,
				};
			};

			it('should call lessonRepo.findByUserId', async () => {
				const { userId } = setup();

				await lessonService.deleteUserData(userId.toHexString());

				expect(lessonRepo.findByUserId).toBeCalledWith(userId.toHexString());
			});

			it('should call lessonRepo.removeUserReference', async () => {
				const { userId } = setup();

				await lessonService.deleteUserData(userId.toHexString());

				expect(lessonRepo.removeUserReference).toBeCalledWith(userId.toHexString());
			});

			it('should update lessons without deleted user', async () => {
				const { expectedResult, userId } = setup();

				const result = await lessonService.deleteUserData(userId.toHexString());

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('handle', () => {
		const setup = () => {
			const targetRefId = new ObjectId().toHexString();
			const targetRefDomain = DomainName.FILERECORDS;
			const deletionRequest = deletionRequestFactory.build({ targetRefId, targetRefDomain });
			const deletionRequestId = deletionRequest.id;

			const expectedData = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
				DomainOperationReportBuilder.build(OperationType.UPDATE, 2, [
					new ObjectId().toHexString(),
					new ObjectId().toHexString(),
				]),
			]);

			return {
				deletionRequestId,
				expectedData,
				targetRefId,
			};
		};

		describe('when UserDeletedEvent is received', () => {
			it('should call deleteUserData in lessonService', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(lessonService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await lessonService.handle({ deletionRequestId, targetRefId });

				expect(lessonService.deleteUserData).toHaveBeenCalledWith(targetRefId);
			});

			it('should call eventBus.publish with DataDeletedEvent', async () => {
				const { deletionRequestId, expectedData, targetRefId } = setup();

				jest.spyOn(lessonService, 'deleteUserData').mockResolvedValueOnce(expectedData);

				await lessonService.handle({ deletionRequestId, targetRefId });

				expect(eventBus.publish).toHaveBeenCalledWith(new DataDeletedEvent(deletionRequestId, expectedData));
			});
		});
	});
});
