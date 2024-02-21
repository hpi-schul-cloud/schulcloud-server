import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { CopyElementType, CopyHelperService, CopyStatus, CopyStatusEnum } from '@modules/copy-helper';
import { CopyFilesService } from '@modules/files-storage-client';
import { TaskCopyService } from '@modules/task';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizableObject } from '@shared/domain/domain-object';
import {
	BaseEntity,
	ComponentEtherpadProperties,
	ComponentGeogebraProperties,
	ComponentInternalProperties,
	ComponentNexboardProperties,
	ComponentProperties,
	ComponentTextProperties,
	ComponentType,
	LessonEntity,
	Material,
} from '@shared/domain/entity';
import { EntityId } from '@shared/domain/types';
import {
	courseFactory,
	lessonFactory,
	materialFactory,
	setupEntities,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { LessonRepo } from '../repository';
import { EtherpadService } from './etherpad.service';
import { LessonCopyService } from './lesson-copy.service';
import { NexboardService } from './nexboard.service';

describe('lesson copy service', () => {
	let module: TestingModule;
	let copyService: LessonCopyService;
	let copyFilesService: DeepMocked<CopyFilesService>;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let etherpadService: DeepMocked<EtherpadService>;
	let nexboardService: DeepMocked<NexboardService>;
	let lessonRepo: DeepMocked<LessonRepo>;
	let configurationSpy: jest.SpyInstance;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				LessonCopyService,
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: TaskCopyService,
					useValue: createMock<TaskCopyService>(),
				},
				{
					provide: EtherpadService,
					useValue: createMock<EtherpadService>(),
				},
				{
					provide: NexboardService,
					useValue: createMock<NexboardService>(),
				},
				{
					provide: CopyFilesService,
					useValue: createMock<CopyFilesService>(),
				},
				{
					provide: LessonRepo,
					useValue: createMock<LessonRepo>(),
				},
			],
		}).compile();

		copyService = module.get(LessonCopyService);
		taskCopyService = module.get(TaskCopyService);
		copyFilesService = module.get(CopyFilesService);
		copyFilesService.copyFilesOfEntity.mockResolvedValue({
			fileUrlReplacements: [],
			fileCopyStatus: { type: CopyElementType.FILE_GROUP, status: CopyStatusEnum.SUCCESS },
		});
		copyHelperService = module.get(CopyHelperService);
		const map: Map<EntityId, AuthorizableObject> = new Map();
		copyHelperService.buildCopyEntityDict.mockReturnValue(map);
		etherpadService = module.get(EtherpadService);
		nexboardService = module.get(NexboardService);
		lessonRepo = module.get(LessonRepo);
	});

	describe('handleCopyLesson', () => {
		describe('when copying a lesson within original course', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);

				const copyName = 'Copy';
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

				return { user, originalCourse, destinationCourse, originalLesson, copyName };
			};

			describe('the copied lesson', () => {
				it('should set name of copy', async () => {
					const { user, destinationCourse, originalLesson, copyName } = setup();

					const response = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
						copyName,
					});
					const lesson = response.copyEntity as LessonEntity;

					expect(lesson.name).toEqual(copyName);
				});

				it('should set name of copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as LessonEntity;
					expect(lesson.name).toEqual(originalLesson.name);
				});

				it('should set course of the copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as LessonEntity;

					expect(lesson.course).toEqual(destinationCourse);
				});

				it('should set the position of copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as LessonEntity;

					expect(lesson.position).toEqual(originalLesson.position);
				});

				it('should set the hidden property of copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as LessonEntity;

					expect(lesson.hidden).toEqual(true);
				});
			});

			describe('the response', () => {
				it('should set status title to the name of the lesson', async () => {
					const { destinationCourse, originalLesson, user, copyName } = setup();

					const status = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
						copyName,
					});

					expect(status.title).toEqual(copyName);
				});

				it('should set status type to lesson', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});

					expect(status.type).toEqual(CopyElementType.LESSON);
				});

				it('should set status originalEntity to original lesson', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});

					expect(status.originalEntity).toEqual(originalLesson);
				});

				it('should set lesson status', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});

					expect(status.status).toEqual(CopyStatusEnum.SUCCESS);
				});

				it('should set status of metadata', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = await copyService.copyLesson({
						originalLessonId: originalLesson.id,
						destinationCourse,
						user,
					});

					const metadataStatus = status.elements?.find((el) => el.type === CopyElementType.METADATA);
					expect(metadataStatus).toBeDefined();
					expect(metadataStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
				});
			});
		});

		describe('when copying into a different course', () => {
			it('should set destination course as course of the copy', async () => {
				const originalCourse = courseFactory.build({});
				const destinationCourse = courseFactory.buildWithId();
				const user = userFactory.build({});
				const originalLesson = lessonFactory.build({ course: originalCourse });
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);

				const status = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const lesson = status.copyEntity as LessonEntity;

				expect(lesson.course).toEqual(destinationCourse);
			});
		});

		describe('when lesson contains no content', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);

				return { user, originalCourse, destinationCourse, originalLesson };
			};

			it('contents array of copied lesson should be empty', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as LessonEntity;

				expect(lesson.contents.length).toEqual(0);
			});

			it('should not set contents status group', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).not.toBeDefined();
			});
		});

		describe('when lesson contains at least one content element', () => {
			const setup = () => {
				const contentOne: ComponentProperties = {
					title: 'title component 1',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'this is a text content',
					},
				};
				const contentTwo: ComponentProperties = {
					title: 'title component 2',
					hidden: false,
					component: ComponentType.LERNSTORE,
					content: {
						resources: [
							{
								url: 'http://foo.bar',
								title: 'foo',
								description: 'bar',
								client: 'client',
								merlinReference: '',
							},
						],
					},
				};
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
					contents: [contentOne, contentTwo],
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);
				return { user, originalCourse, destinationCourse, originalLesson };
			};

			it('contents array of copied lesson should contain content elments of original lesson', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as LessonEntity;

				expect(lesson.contents.length).toEqual(2);
				expect(lesson.contents).toEqual(originalLesson.contents);
			});

			it('copied content should persist the original hidden value', async () => {
				const { user, destinationCourse, originalLesson } = setup();
				originalLesson.contents[0].hidden = true;
				originalLesson.contents[1].hidden = false;

				const status = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as LessonEntity;

				expect(lesson.contents[0].hidden).toEqual(true);
				expect(lesson.contents[1].hidden).toEqual(false);
			});

			it('should set contents status group with correct amount of children status elements', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).toBeDefined();
				expect(contentsStatus?.elements?.length).toEqual(2);
				if (contentsStatus?.elements && contentsStatus?.elements[0]) {
					expect(contentsStatus?.elements[0].status).toEqual(CopyStatusEnum.SUCCESS);
				}
			});

			it('should set contents status group with correct status', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).toBeDefined();
				expect(contentsStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});
		});
	});

	describe('when lesson contains text content element', () => {
		const setup = (text = 'this is a text content') => {
			const textContent: ComponentProperties = {
				title: 'text component 1',
				hidden: false,
				component: ComponentType.TEXT,
				content: {
					text,
				},
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [textContent],
			});
			lessonRepo.findById.mockResolvedValueOnce(originalLesson);

			return { user, originalCourse, destinationCourse, originalLesson, textContent };
		};

		it('should set content type to LESSON_CONTENT_TEXT', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].type).toEqual(CopyElementType.LESSON_CONTENT_TEXT);
				expect(contentsStatus.elements[0].status).toEqual(CopyStatusEnum.SUCCESS);
			}
		});

		it('should replace copied urls in lesson text', async () => {
			const FILE_ID_TO_BE_REPLACED = '12837461287346091823z490812374098127340987123';
			const NEW_FILE_ID = '19843275091827465871246598716239438';
			const { user, destinationCourse, originalLesson } = setup(
				`Here is a <a href="${FILE_ID_TO_BE_REPLACED}">link</a> to a file`
			);

			copyFilesService.copyFilesOfEntity.mockResolvedValue({
				fileUrlReplacements: [
					{
						regex: new RegExp(FILE_ID_TO_BE_REPLACED),
						replacement: NEW_FILE_ID,
					},
				],
				fileCopyStatus: { type: CopyElementType.FILE_GROUP, status: CopyStatusEnum.SUCCESS },
			});

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const lessonCopy = status.copyEntity as LessonEntity;
			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			expect((lessonCopy.contents[0].content as ComponentTextProperties).text).not.toContain(FILE_ID_TO_BE_REPLACED);
		});
	});

	describe('when lesson contains LernStore content element', () => {
		const setup = () => {
			const lernStoreContent: ComponentProperties = {
				title: 'text component 1',
				hidden: false,
				component: ComponentType.LERNSTORE,
				content: {
					resources: [
						{
							url: 'https://foo.bar/baz',
							title: 'Test title',
							description: 'description',
							client: 'Schul-Cloud',
							merlinReference: '',
						},
					],
				},
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [lernStoreContent],
			});
			lessonRepo.findById.mockResolvedValueOnce(originalLesson);

			return { user, originalCourse, destinationCourse, originalLesson, lernStoreContent };
		};

		it('the content should be fully copied', async () => {
			const { user, destinationCourse, originalLesson, lernStoreContent } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const copiedLessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			expect(copiedLessonContents[0]).toEqual(lernStoreContent);
		});

		it('should set content type to LESSON_CONTENT_LERNSTORE', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].type).toEqual(CopyElementType.LESSON_CONTENT_LERNSTORE);
				expect(contentsStatus.elements[0].status).toEqual(CopyStatusEnum.SUCCESS);
			}
		});
	});

	describe('when lesson contains LernStore content element without set resource', () => {
		const setup = () => {
			const lernStoreContent: ComponentProperties = {
				title: 'text component 1',
				hidden: false,
				component: ComponentType.LERNSTORE,
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [lernStoreContent],
			});
			lessonRepo.findById.mockResolvedValueOnce(originalLesson);

			return { user, originalCourse, destinationCourse, originalLesson, lernStoreContent };
		};

		it('the content should be fully copied', async () => {
			const { user, destinationCourse, originalLesson, lernStoreContent } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const copiedLessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			expect(copiedLessonContents[0]).toEqual(lernStoreContent);
		});

		it('should set content type to LESSON_CONTENT_LERNSTORE', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].type).toEqual(CopyElementType.LESSON_CONTENT_LERNSTORE);
				expect(contentsStatus.elements[0].status).toEqual(CopyStatusEnum.SUCCESS);
			}
		});
	});

	describe('when lesson contains geoGebra content element', () => {
		const setup = () => {
			const geoGebraContent: ComponentProperties = {
				title: 'text component 1',
				hidden: false,
				component: ComponentType.GEOGEBRA,
				content: {
					materialId: 'foo',
				},
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [geoGebraContent],
			});
			lessonRepo.findById.mockResolvedValueOnce(originalLesson);

			return { user, originalCourse, destinationCourse, originalLesson };
		};

		it('geoGebra Material-ID should not be copied', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			const geoGebraContent = lessonContents[0].content as ComponentGeogebraProperties;

			expect(geoGebraContent.materialId).toEqual('');
		});

		it('element should be hidden', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			expect(lessonContents[0].hidden).toEqual(true);
		});

		it('content status should have correct status value', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].status).toEqual(CopyStatusEnum.PARTIAL);
			}
		});

		it('should set content type to LESSON_CONTENT_GEOGEBRA', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].type).toEqual(CopyElementType.LESSON_CONTENT_GEOGEBRA);
			}
		});
	});

	describe('when lesson contains linked tasks', () => {
		describe('when no tasks are linked to the original lesson', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});

				return {
					user,
					destinationCourse,
					originalLesson,
				};
			};

			it('should not set task status', async () => {
				const { originalLesson, destinationCourse, user } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const tasksGroupStatus = copyStatus.elements?.find((el) => el.type === CopyElementType.TASK_GROUP);
				expect(tasksGroupStatus).not.toBeDefined();
			});
		});

		describe('when a single task is linked to the original lesson', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);
				const originalTask = taskFactory.build({
					course: originalCourse,
					lesson: originalLesson,
				});
				const taskCopy = taskFactory.build({ name: originalTask.name });
				const mockedTaskStatus = {
					title: taskCopy.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopy,
				};
				const mockedTaskGroupStatus = {
					type: CopyElementType.TASK_GROUP,
					status: CopyStatusEnum.SUCCESS,
					elements: [mockedTaskStatus],
				};
				taskCopyService.copyTask.mockResolvedValue(mockedTaskStatus);

				return {
					user,
					destinationCourse,
					originalLesson,
					originalTask,
					mockedTaskStatus,
					mockedTaskGroupStatus,
				};
			};

			it('should put copy status tasks leaf', async () => {
				const { originalLesson, destinationCourse, user, mockedTaskGroupStatus } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const tasksGroupStatus = copyStatus.elements?.find((el) => el.type === CopyElementType.TASK_GROUP);
				expect(tasksGroupStatus).toBeDefined();
				expect(tasksGroupStatus).toEqual(mockedTaskGroupStatus);
			});

			it('should put copy status for the copied task', async () => {
				const { originalLesson, originalTask, destinationCourse, user, mockedTaskStatus } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const tasksGroupStatus = copyStatus.elements?.find((el) => el.type === CopyElementType.TASK_GROUP);
				expect(tasksGroupStatus).toBeDefined();
				const tasksStatus = tasksGroupStatus?.elements?.find(
					(el) => el.type === CopyElementType.TASK && el.title === originalTask.name
				);
				expect(tasksStatus).toBeDefined();
				expect(tasksStatus).toEqual(mockedTaskStatus);
			});
		});

		describe('when mupltiple tasks are linked to the original lesson', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);
				const originalTasks = taskFactory.buildList(2, {
					course: originalCourse,
					lesson: originalLesson,
				});
				const taskCopyOne = taskFactory.build({ name: originalTasks[0].name });
				const taskCopyTwo = taskFactory.build({ name: originalTasks[1].name });
				const mockedTaskStatusOne = {
					title: taskCopyOne.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopyOne,
				};
				const mockedTaskStatusTwo = {
					title: taskCopyTwo.name,
					type: CopyElementType.TASK,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: taskCopyTwo,
				};
				taskCopyService.copyTask.mockResolvedValueOnce(mockedTaskStatusOne).mockResolvedValueOnce(mockedTaskStatusTwo);

				return {
					user,
					destinationCourse,
					originalLesson,
					mockedTaskStatusOne,
					mockedTaskStatusTwo,
				};
			};

			it('should put copy status for each copied task under tasks', async () => {
				const { originalLesson, destinationCourse, user, mockedTaskStatusOne, mockedTaskStatusTwo } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const tasksGroupStatus = copyStatus.elements?.find((el) => el.type === CopyElementType.TASK_GROUP);
				expect(tasksGroupStatus).toBeDefined();
				expect(tasksGroupStatus?.elements).toEqual([mockedTaskStatusOne, mockedTaskStatusTwo]);
			});
		});
	});

	describe('when lesson contains Etherpad content element', () => {
		const setup = () => {
			const etherpadContent: ComponentProperties = {
				title: 'text',
				hidden: false,
				component: ComponentType.ETHERPAD,
				content: {
					description: 'foo',
					title: 'bar',
					url: 'baz',
				},
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [etherpadContent],
			});
			lessonRepo.findById.mockResolvedValueOnce(originalLesson);

			etherpadService.createEtherpad.mockResolvedValue('abc');

			configurationSpy = jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'FEATURE_ETHERPAD_ENABLED') {
					return true;
				}
				if (config === 'ETHERPAD__PAD_URI') {
					return 'http://pad.uri';
				}
				return null;
			});

			return { user, originalCourse, destinationCourse, originalLesson };
		};

		it('should not call etherpad service, if feature flag is false', async () => {
			const { user, destinationCourse, originalLesson } = setup();
			configurationSpy = jest.spyOn(Configuration, 'get').mockReturnValue(false);

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			expect(configurationSpy).toHaveBeenCalledWith('FEATURE_ETHERPAD_ENABLED');
			expect(etherpadService.createEtherpad).not.toHaveBeenCalled();
			expect(lessonContents).toEqual([]);

			configurationSpy = jest.spyOn(Configuration, 'get').mockReturnValue(true);
		});

		it('should call etherpad service to create new etherpad', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			expect(etherpadService.createEtherpad).toHaveBeenCalled();
		});

		it('should not copy the etherpad content, if etherpad creation fails', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			etherpadService.createEtherpad.mockResolvedValue(false);

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			let contentStatus = CopyStatusEnum.SUCCESS;
			const group = status.elements?.filter((element) => element.type === CopyElementType.LESSON_CONTENT_GROUP)[0];
			if (group && group.elements) {
				contentStatus = group.elements[0].status;
			}
			expect(contentStatus).toEqual(CopyStatusEnum.FAIL);

			const lessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			expect(lessonContents.length).toEqual(0);
		});

		it('should copy etherpad correctly', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			etherpadService.createEtherpad.mockResolvedValue('abc');

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const copiedLessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			const copiedEtherpad = copiedLessonContents[0].content as ComponentEtherpadProperties;
			expect(copiedEtherpad.url).toEqual('http://pad.uri/abc');
		});

		it('should set content type to LESSON_CONTENT_ETHERPAD', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			etherpadService.createEtherpad.mockResolvedValue('abc');

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].type).toEqual(CopyElementType.LESSON_CONTENT_ETHERPAD);
			}
		});
	});

	describe('when lesson contains embedded task element', () => {
		const setup = () => {
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const embeddedTaskContent: ComponentProperties = {
				title: 'title',
				hidden: false,
				component: ComponentType.INTERNAL,
				content: {
					url: 'http://somebasedomain.de/homework/someid',
				},
			};
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [embeddedTaskContent],
			});
			lessonRepo.findById.mockResolvedValueOnce(originalLesson);

			return {
				user,
				destinationCourse,
				originalLesson,
				embeddedTaskContent,
			};
		};

		it('should add status for embedded task as SUCCESS', async () => {
			const { originalLesson, destinationCourse, user } = setup();
			const copyStatus = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const contentsStatus = copyStatus.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			if (!contentsStatus || !contentsStatus.elements || contentsStatus.elements.length < 1) {
				throw new Error('element not found');
			}
			const embeddedTaskStatus = contentsStatus.elements[0];

			expect(embeddedTaskStatus.status).toEqual(CopyStatusEnum.SUCCESS);
		});

		it('should add embedded task to copy', async () => {
			const { originalLesson, destinationCourse, user, embeddedTaskContent } = setup();
			const copyStatus = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const lesson = copyStatus.copyEntity as LessonEntity;
			const embeddedTaskLink = lesson.contents.find((el) => el.component === ComponentType.INTERNAL);

			expect(embeddedTaskLink).toEqual(embeddedTaskContent);
		});

		it('should set content type to LESSON_CONTENT_TASK', async () => {
			const { user, destinationCourse, originalLesson } = setup();
			const copyStatus = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const contentsStatus = copyStatus.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].type).toEqual(CopyElementType.LESSON_CONTENT_TASK);
			}
		});
	});

	describe('when lesson contains neXboard content element', () => {
		const setup = () => {
			const nexboardContent: ComponentProperties = {
				title: 'text',
				hidden: false,
				component: ComponentType.NEXBOARD,
				content: {
					board: '123',
					description: 'foo',
					title: 'bar',
					url: 'baz',
				},
			};
			const user = userFactory.build();
			const originalCourse = courseFactory.build({ school: user.school });
			const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
			const originalLesson = lessonFactory.build({
				course: originalCourse,
				contents: [nexboardContent],
			});
			lessonRepo.findById.mockResolvedValueOnce(originalLesson);

			nexboardService.createNexboard.mockResolvedValue({ board: '123', url: 'abc' });

			configurationSpy = jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'FEATURE_NEXBOARD_ENABLED') {
					return true;
				}
				if (config === 'FEATURE_NEXBOARD_COPY_ENABLED') {
					return true;
				}
				return null;
			});

			return { user, originalCourse, destinationCourse, originalLesson };
		};

		it('should not call neXboard service, if copy feature flag is false', async () => {
			const { user, destinationCourse, originalLesson } = setup();
			configurationSpy = jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'FEATURE_NEXBOARD_ENABLED') {
					return true;
				}
				if (config === 'FEATURE_NEXBOARD_COPY_ENABLED') {
					return false;
				}
				return null;
			});

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			expect(configurationSpy).toHaveBeenCalledWith('FEATURE_NEXBOARD_COPY_ENABLED');
			expect(nexboardService.createNexboard).not.toHaveBeenCalled();
			expect(lessonContents).toEqual([]);

			configurationSpy = jest.spyOn(Configuration, 'get').mockReturnValue(true);
		});

		it('should call neXboard service to create new neXboard', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			expect(nexboardService.createNexboard).toHaveBeenCalled();
		});

		it('should not copy the neXboard content, if neXboard creation fails', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			nexboardService.createNexboard.mockResolvedValue(false);

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});

			let contentStatus = CopyStatusEnum.SUCCESS;
			const group = status.elements?.filter((element) => element.type === CopyElementType.LESSON_CONTENT_GROUP)[0];
			if (group && group.elements) {
				contentStatus = group.elements[0].status;
			}
			expect(contentStatus).toEqual(CopyStatusEnum.FAIL);

			const lessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			expect(lessonContents.length).toEqual(0);
		});

		it('should copy neXboard correctly', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			nexboardService.createNexboard.mockResolvedValue({ board: '123', url: 'abc' });

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const copiedLessonContents = (status.copyEntity as LessonEntity).contents as ComponentProperties[];
			const copiedNexboard = copiedLessonContents[0].content as ComponentNexboardProperties;
			expect(copiedNexboard.url).toEqual('abc');
			expect(copiedNexboard.board).toEqual('123');
		});

		it('should set content type to LESSON_CONTENT_NEXBOARD', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			nexboardService.createNexboard.mockResolvedValue({ board: '123', url: 'abc' });

			const status = await copyService.copyLesson({
				originalLessonId: originalLesson.id,
				destinationCourse,
				user,
			});
			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].type).toEqual(CopyElementType.LESSON_CONTENT_NEXBOARD);
			}
		});
	});

	describe('when lesson contains linked materials', () => {
		describe('when no materials are linked to the original lesson', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalLesson = lessonFactory.build({
					course: originalCourse,
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);

				return {
					user,
					destinationCourse,
					originalLesson,
				};
			};

			it('should not set materials status', async () => {
				const { originalLesson, destinationCourse, user } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const materialsGroupStatus = copyStatus.elements?.find(
					(el) => el.type === CopyElementType.LERNSTORE_MATERIAL_GROUP
				);
				expect(materialsGroupStatus).not.toBeDefined();
			});
		});

		describe('when a single material is linked to the original lesson', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalMaterial = materialFactory.build();
				const originalLesson = lessonFactory.build({
					course: originalCourse,
					materials: [originalMaterial],
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);
				const materialCopy = materialFactory.build({ title: originalMaterial.title });
				const mockedMaterialStatus = {
					title: materialCopy.title,
					type: CopyElementType.LERNSTORE_MATERIAL,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: materialCopy,
				};
				const mockedMaterialGroupStatus = {
					type: CopyElementType.LERNSTORE_MATERIAL_GROUP,
					status: CopyStatusEnum.SUCCESS,
					elements: [mockedMaterialStatus],
				};

				return {
					user,
					destinationCourse,
					originalLesson,
					originalMaterial,
					mockedMaterialStatus,
					mockedMaterialGroupStatus,
				};
			};

			it('should copy the material correctly', async () => {
				const { originalLesson, destinationCourse, user, originalMaterial } = setup();
				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const copiedLesson = copyStatus.copyEntity as LessonEntity;
				const copiedMaterial = copiedLesson.materials[0];
				expect(copiedLesson.materials.length).toEqual(1);
				expect(copiedMaterial.title).toEqual(originalMaterial.title);
				expect(copiedMaterial.url).toEqual(originalMaterial.url);
			});

			it('should put copy status materials leaf', async () => {
				const { originalLesson, destinationCourse, user, mockedMaterialGroupStatus } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const materialsGroupStatus = copyStatus.elements?.find(
					(el) => el.type === CopyElementType.LERNSTORE_MATERIAL_GROUP
				);
				expect(materialsGroupStatus).toBeDefined();
				expect(materialsGroupStatus).toEqual(mockedMaterialGroupStatus);
			});

			it('should put copy status for the copied material', async () => {
				const { originalLesson, originalMaterial, destinationCourse, user, mockedMaterialStatus } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const materialsGroupStatus = copyStatus.elements?.find(
					(el) => el.type === CopyElementType.LERNSTORE_MATERIAL_GROUP
				);
				expect(materialsGroupStatus).toBeDefined();
				const materialStatus = materialsGroupStatus?.elements?.find(
					(el) => el.type === CopyElementType.LERNSTORE_MATERIAL && el.title === originalMaterial.title
				);
				expect(materialStatus).toBeDefined();
				expect(materialStatus?.title).toEqual(mockedMaterialStatus.title);
				expect(materialStatus?.status).toEqual(mockedMaterialStatus.status);
				const material = materialStatus?.copyEntity as Material;
				expect(material?.description).toEqual(mockedMaterialStatus?.copyEntity?.description);
			});
		});

		describe('when mupltiple materials are linked to the original lesson', () => {
			const setup = () => {
				const user = userFactory.build();
				const originalCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
				const originalMaterial = materialFactory.buildList(2);
				const originalLesson = lessonFactory.build({
					course: originalCourse,
					materials: originalMaterial,
				});
				lessonRepo.findById.mockResolvedValueOnce(originalLesson);
				const materialCopyOne = materialFactory.build({ title: originalMaterial[0].title });
				const materialCopyTwo = materialFactory.build({ title: originalMaterial[1].title });
				const mockedMaterialStatusOne = {
					title: materialCopyOne.title,
					type: CopyElementType.LERNSTORE_MATERIAL,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: materialCopyOne,
				};
				const mockedMaterialStatusTwo = {
					title: materialCopyTwo.title,
					type: CopyElementType.LERNSTORE_MATERIAL,
					status: CopyStatusEnum.SUCCESS,
					copyEntity: materialCopyTwo,
				};

				return {
					user,
					destinationCourse,
					originalLesson,
					mockedMaterialStatusOne,
					mockedMaterialStatusTwo,
				};
			};

			it('should put copy status for each copied material under materials', async () => {
				const { originalLesson, destinationCourse, user, mockedMaterialStatusOne, mockedMaterialStatusTwo } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLessonId: originalLesson.id,
					destinationCourse,
					user,
				});
				const materialsGroupStatus = copyStatus.elements?.find(
					(el) => el.type === CopyElementType.LERNSTORE_MATERIAL_GROUP
				);
				expect(materialsGroupStatus).toBeDefined();
				expect(materialsGroupStatus?.elements?.map((el) => el.title)).toEqual([
					mockedMaterialStatusOne.title,
					mockedMaterialStatusTwo.title,
				]);
			});
		});
	});

	describe('updateCopiedEmbeddedTasks', () => {
		it('should leave non-lesson status as is', () => {
			const status = {
				type: CopyElementType.COURSE,
				status: CopyStatusEnum.SUCCESS,
				elements: [
					{
						type: CopyElementType.TASK,
						status: CopyStatusEnum.SUCCESS,
					},
				],
			};
			const copyDict = copyHelperService.buildCopyEntityDict(status);
			const result = copyService.updateCopiedEmbeddedTasks(status, copyDict);

			expect(result).toEqual(status);
		});

		describe('when status contains lesson with embedded tasks', () => {
			const setup = () => {
				const originalLesson = lessonFactory.buildWithId();
				const copiedLesson = lessonFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({ lesson: originalLesson });
				const copiedTask = taskFactory.buildWithId({ lesson: copiedLesson });
				const embeddedTaskContent: ComponentProperties = {
					title: 'title',
					hidden: false,
					component: ComponentType.INTERNAL,
					content: {
						url: `http://somebasedomain.de/homeworks/${originalTask.id}`,
					},
				};
				const textContent: ComponentProperties = {
					title: 'title component',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'this is a text content',
					},
				};
				copiedLesson.contents = [{ ...textContent }, embeddedTaskContent, { ...textContent }];
				const copyStatus: CopyStatus = {
					type: CopyElementType.LESSON,
					status: CopyStatusEnum.SUCCESS,
					originalEntity: originalLesson,
					copyEntity: copiedLesson,
					elements: [
						{
							type: CopyElementType.TASK,
							status: CopyStatusEnum.SUCCESS,
							originalEntity: originalTask,
							copyEntity: copiedTask,
						},
						{
							type: CopyElementType.LESSON_CONTENT_GROUP,
							status: CopyStatusEnum.PARTIAL,
							elements: [
								{
									type: CopyElementType.LESSON_CONTENT_TEXT,
									status: CopyStatusEnum.SUCCESS,
								},
								{
									type: CopyElementType.LESSON_CONTENT_TASK,
									status: CopyStatusEnum.SUCCESS,
								},
								{
									type: CopyElementType.LESSON_CONTENT_TEXT,
									status: CopyStatusEnum.SUCCESS,
								},
							],
						},
					],
				};
				const copyDict = new Map<EntityId, BaseEntity>();
				copyDict.set(originalTask.id, copiedTask);
				copyHelperService.buildCopyEntityDict.mockReturnValue(copyDict);
				return { copyStatus, copiedTask, originalTask };
			};

			it('should update taskIds in lesson, if tasks were copied', () => {
				const { copyStatus, originalTask, copiedTask } = setup();
				const copyDict = copyHelperService.buildCopyEntityDict(copyStatus);
				const updatedCopyStatus = copyService.updateCopiedEmbeddedTasks(copyStatus, copyDict);
				const lesson = updatedCopyStatus?.copyEntity as LessonEntity;
				if (lesson === undefined || lesson.contents === undefined) {
					throw new Error('lesson should be part of the copy');
				}
				const content = lesson.contents.find((el) => el.component === ComponentType.INTERNAL);
				expect((content?.content as ComponentInternalProperties).url).not.toContain(originalTask.id);
				expect((content?.content as ComponentInternalProperties).url).toContain(copiedTask.id);
			});

			it('should maintain order of content elements', () => {
				const { copyStatus } = setup();
				const copyDict = copyHelperService.buildCopyEntityDict(copyStatus);
				const updatedCopyStatus = copyService.updateCopiedEmbeddedTasks(copyStatus, copyDict);
				const lesson = updatedCopyStatus?.copyEntity as LessonEntity;
				if (lesson === undefined || lesson.contents === undefined) {
					throw new Error('lesson should be part of the copy');
				}
				expect(lesson.contents[1].component).toEqual(ComponentType.INTERNAL);
			});

			it('should keep original url when task is not in dictionary (has not been copied)', () => {
				const { copyStatus, originalTask } = setup();
				copyHelperService.buildCopyEntityDict.mockReturnValue(new Map<EntityId, AuthorizableObject>());
				const copyDict = copyHelperService.buildCopyEntityDict(copyStatus);
				const updatedCopyStatus = copyService.updateCopiedEmbeddedTasks(copyStatus, copyDict);
				const lesson = updatedCopyStatus?.copyEntity as LessonEntity;
				if (lesson === undefined || lesson.contents === undefined) {
					throw new Error('lesson should be part of the copy');
				}
				const content = lesson.contents.find((el) => el.component === ComponentType.INTERNAL);
				expect((content?.content as ComponentInternalProperties).url).toEqual(
					`http://somebasedomain.de/homeworks/${originalTask.id}`
				);
			});

			it('should use copyHelperService to build a dictionary', () => {
				const { copyStatus } = setup();
				const copyDict = copyHelperService.buildCopyEntityDict(copyStatus);
				copyService.updateCopiedEmbeddedTasks(copyStatus, copyDict);
				expect(copyHelperService.buildCopyEntityDict).toHaveBeenCalled();
			});
		});
	});
});
