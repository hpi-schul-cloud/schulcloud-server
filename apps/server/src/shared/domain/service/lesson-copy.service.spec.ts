import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Configuration } from '@hpi-schul-cloud/commons';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import {
	ComponentType,
	CopyElementType,
	CopyStatusEnum,
	IComponentEtherpadProperties,
	IComponentGeogebraProperties,
	IComponentNexboardProperties,
	IComponentProperties,
	Lesson,
	TaskCopyService,
} from '@shared/domain';
import { courseFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { CopyHelperService } from './copy-helper.service';
import { EtherpadService } from './etherpad.service';
import { NexboardService } from './nexboard.service';
import { LessonCopyService } from './lesson-copy.service';

describe('lesson copy service', () => {
	let module: TestingModule;
	let copyService: LessonCopyService;
	let taskCopyService: DeepMocked<TaskCopyService>;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let etherpadService: DeepMocked<EtherpadService>;
	let nexboardService: DeepMocked<NexboardService>;
	let configurationSpy: jest.SpyInstance;

	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
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
			],
		}).compile();

		copyService = module.get(LessonCopyService);
		taskCopyService = module.get(TaskCopyService);
		copyHelperService = module.get(CopyHelperService);
		etherpadService = module.get(EtherpadService);
		nexboardService = module.get(NexboardService);
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

				const copyName = 'Copy';
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);

				return { user, originalCourse, destinationCourse, originalLesson, copyName };
			};

			describe('the copied lesson', () => {
				it('should set name of copy', async () => {
					const { user, destinationCourse, originalLesson, copyName } = setup();

					const response = await copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
						copyName,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.name).toEqual(copyName);
				});

				it('should set name of copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;
					expect(lesson.name).toEqual(originalLesson.name);
				});

				it('should set course of the copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.course).toEqual(destinationCourse);
				});

				it('should set the position of copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.position).toEqual(originalLesson.position);
				});

				it('should set the hidden property of copy', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const response = await copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});
					const lesson = response.copyEntity as Lesson;

					expect(lesson.hidden).toEqual(true);
				});
			});

			describe('the response', () => {
				it('should set status title to the name of the lesson', async () => {
					const { destinationCourse, originalLesson, user, copyName } = setup();

					const status = await copyService.copyLesson({ originalLesson, destinationCourse, user, copyName });

					expect(status.title).toEqual(copyName);
				});

				it('should set status type to lesson', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = await copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					expect(status.type).toEqual(CopyElementType.LESSON);
				});

				it('should set lesson status', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = await copyService.copyLesson({
						originalLesson,
						destinationCourse,
						user,
					});

					expect(status.status).toEqual(CopyStatusEnum.SUCCESS);
				});

				it('should set status of metadata', async () => {
					const { user, destinationCourse, originalLesson } = setup();

					const status = await copyService.copyLesson({
						originalLesson,
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
				const destinationCourse = courseFactory.build({});
				const user = userFactory.build({});
				const originalLesson = lessonFactory.build({ course: originalCourse });

				const status = await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				const lesson = status.copyEntity as Lesson;

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

				return { user, originalCourse, destinationCourse, originalLesson };
			};

			it('contents array of copied lesson should be empty', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as Lesson;

				expect(lesson.contents.length).toEqual(0);
			});

			it('should not set contents status group', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).not.toBeDefined();
			});
		});

		describe('when lesson contains at least one content element', () => {
			const setup = () => {
				const contentOne: IComponentProperties = {
					title: 'title component 1',
					hidden: false,
					component: ComponentType.TEXT,
					content: {
						text: 'this is a text content',
					},
				};
				const contentTwo: IComponentProperties = {
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
				copyHelperService.deriveStatusFromElements.mockReturnValue(CopyStatusEnum.SUCCESS);
				return { user, originalCourse, destinationCourse, originalLesson };
			};

			it('contents array of copied lesson should contain content elments of original lesson', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as Lesson;

				expect(lesson.contents.length).toEqual(2);
				expect(lesson.contents).toEqual(originalLesson.contents);
			});

			it('copied content should persist the original hidden value', async () => {
				const { user, destinationCourse, originalLesson } = setup();
				originalLesson.contents[0].hidden = true;
				originalLesson.contents[1].hidden = false;

				const status = await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});

				const lesson = status.copyEntity as Lesson;

				expect(lesson.contents[0].hidden).toEqual(true);
				expect(lesson.contents[1].hidden).toEqual(false);
			});

			it('should set contents status group with correct amount of children status elements', async () => {
				const { user, destinationCourse, originalLesson } = setup();

				const status = await copyService.copyLesson({
					originalLesson,
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
					originalLesson,
					destinationCourse,
					user,
				});
				const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
				expect(contentsStatus).toBeDefined();
				expect(contentsStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});
		});
	});

	describe('when lesson contains LernStore content element', () => {
		const setup = () => {
			const lernStoreContent: IComponentProperties = {
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

			return { user, originalCourse, destinationCourse, originalLesson, lernStoreContent };
		};

		it('the content should be fully copied', async () => {
			const { user, destinationCourse, originalLesson, lernStoreContent } = setup();

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const copiedLessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(copiedLessonContents[0]).toEqual(lernStoreContent);
		});
	});

	describe('when lesson contains geoGebra content element', () => {
		const setup = () => {
			const geoGebraContent: IComponentProperties = {
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

			return { user, originalCourse, destinationCourse, originalLesson };
		};

		it('geoGebra Material-ID should not be copied', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			const geoGebraContent = lessonContents[0].content as IComponentGeogebraProperties;

			expect(geoGebraContent.materialId).toEqual('');
		});

		it('element should be hidden', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(lessonContents[0].hidden).toEqual(true);
		});

		it('content status should have correct status value', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const contentsStatus = status.elements?.find((el) => el.type === CopyElementType.LESSON_CONTENT_GROUP);
			expect(contentsStatus).toBeDefined();
			if (contentsStatus?.elements) {
				expect(contentsStatus.elements[0].status).toEqual(CopyStatusEnum.PARTIAL);
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
				const taskSpy = jest.spyOn(taskCopyService, 'copyTaskMetadata');

				return {
					user,
					destinationCourse,
					originalLesson,
					taskSpy,
				};
			};

			it('should not set task status', async () => {
				const { originalLesson, destinationCourse, user } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				const tasksStatus = copyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
				expect(tasksStatus).not.toBeDefined();
			});

			it('should not call task copy service', async () => {
				const { originalLesson, destinationCourse, user, taskSpy } = setup();

				await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				expect(taskSpy).not.toHaveBeenCalled();
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
				const taskSpy = jest.spyOn(taskCopyService, 'copyTaskMetadata').mockImplementation(() => mockedTaskStatus);

				return {
					user,
					destinationCourse,
					originalLesson,
					originalTask,
					mockedTaskStatus,
					taskSpy,
					mockedTaskGroupStatus,
				};
			};

			it('should put copy status tasks leaf', async () => {
				const { originalLesson, destinationCourse, user, mockedTaskGroupStatus } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLesson,
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
					originalLesson,
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

			it('should call taskCopyService for the linked task', async () => {
				const { originalLesson, destinationCourse, user, originalTask, taskSpy } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLesson,
					destinationCourse,
					user,
				});
				expect(taskSpy).toHaveBeenCalledWith({
					originalTask,
					destinationCourse,
					destinationLesson: copyStatus.copyEntity,
					user,
				});
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
				const mockedTaskGroupStatus = {
					type: CopyElementType.TASK_GROUP,
					status: CopyStatusEnum.SUCCESS,
					elements: [mockedTaskStatusOne, mockedTaskStatusTwo],
				};
				jest
					.spyOn(taskCopyService, 'copyTaskMetadata')
					.mockReturnValueOnce(mockedTaskStatusOne)
					.mockReturnValueOnce(mockedTaskStatusTwo);

				return {
					user,
					destinationCourse,
					originalLesson,
					mockedTaskStatusOne,
					mockedTaskStatusTwo,
					mockedTaskGroupStatus,
				};
			};

			it('should put copy status for each copied task under tasks', async () => {
				const { originalLesson, destinationCourse, user, mockedTaskStatusOne, mockedTaskStatusTwo } = setup();

				const copyStatus = await copyService.copyLesson({
					originalLesson,
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
			const etherpadContent: IComponentProperties = {
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
				originalLesson,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(configurationSpy).toHaveBeenCalledWith('FEATURE_ETHERPAD_ENABLED');
			expect(etherpadService.createEtherpad).not.toHaveBeenCalled();
			expect(lessonContents).toEqual([]);

			configurationSpy = jest.spyOn(Configuration, 'get').mockReturnValue(true);
		});

		it('should call etherpad service to create new etherpad', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			expect(etherpadService.createEtherpad).toHaveBeenCalled();
		});

		it('should not copy the etherpad content, if etherpad creation fails', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			etherpadService.createEtherpad.mockResolvedValue(false);

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			let contentStatus = CopyStatusEnum.SUCCESS;
			const group = status.elements?.filter((element) => element.type === CopyElementType.LESSON_CONTENT_GROUP)[0];
			if (group && group.elements) {
				contentStatus = group.elements[0].status;
			}
			expect(contentStatus).toEqual(CopyStatusEnum.FAIL);

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(lessonContents.length).toEqual(0);
		});

		it('should copy etherpad correctly', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			etherpadService.createEtherpad.mockResolvedValue('abc');

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});
			const copiedLessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			const copiedEtherpad = copiedLessonContents[0].content as IComponentEtherpadProperties;
			expect(copiedEtherpad.url).toEqual('http://pad.uri/abc');
		});
	});

	describe('when lesson contains nexBoard content element', () => {
		const setup = () => {
			const nexboardContent: IComponentProperties = {
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

			nexboardService.createNexboard.mockResolvedValue({ board: '123', url: 'abc' });

			configurationSpy = jest.spyOn(Configuration, 'get').mockImplementation((config: string) => {
				if (config === 'FEATURE_NEXBOARD_ENABLED') {
					return true;
				}
				return null;
			});

			return { user, originalCourse, destinationCourse, originalLesson };
		};

		it('should not call nexboard service, if feature flag is false', async () => {
			const { user, destinationCourse, originalLesson } = setup();
			configurationSpy = jest.spyOn(Configuration, 'get').mockReturnValue(false);

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(configurationSpy).toHaveBeenCalledWith('FEATURE_NEXBOARD_ENABLED');
			expect(nexboardService.createNexboard).not.toHaveBeenCalled();
			expect(lessonContents).toEqual([]);

			configurationSpy = jest.spyOn(Configuration, 'get').mockReturnValue(true);
		});

		it('should call nexboard service to create new nexboard', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			expect(nexboardService.createNexboard).toHaveBeenCalled();
		});

		it('should not copy the nexboard content, if nexboard creation fails', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			nexboardService.createNexboard.mockResolvedValue(false);

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});

			let contentStatus = CopyStatusEnum.SUCCESS;
			const group = status.elements?.filter((element) => element.type === CopyElementType.LESSON_CONTENT_GROUP)[0];
			if (group && group.elements) {
				contentStatus = group.elements[0].status;
			}
			expect(contentStatus).toEqual(CopyStatusEnum.FAIL);

			const lessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			expect(lessonContents.length).toEqual(0);
		});

		it('should copy nexboard correctly', async () => {
			const { user, destinationCourse, originalLesson } = setup();

			nexboardService.createNexboard.mockResolvedValue({ board: '123', url: 'abc' });

			const status = await copyService.copyLesson({
				originalLesson,
				destinationCourse,
				user,
			});
			const copiedLessonContents = (status.copyEntity as Lesson).contents as IComponentProperties[];
			const copiedNexboard = copiedLessonContents[0].content as IComponentNexboardProperties;
			expect(copiedNexboard.url).toEqual('abc');
			expect(copiedNexboard.board).toEqual('123');
		});
	});
});
