import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, IComponentProperties } from '@shared/domain';
import { courseFactory, lessonFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { FileDto, FilesStorageClientAdapterService } from '@src/modules';
import { FileRecordParamsParentTypeEnum } from '@src/modules/files-storage-client/filesStorageApi/v3';
import { CopyElementType, CopyStatus, CopyStatusEnum } from '../types';
import { CopyHelperService } from './copy-helper.service';
import { FileCopyAppendService } from './file-copy-append.service';
import { FileLegacyService } from './file-legacy.service';

const getImageHtml = (id = '62e3a55226cefc001d5b0a7a') =>
	`<figure class="image"><img src="/files/file?file=${id}&amp;name=david-marcu-78A265wPiO4-unsplash (1).jpg" alt /></figure>`;
const getAudioHtml = (id = '62e3a78126cefc001d5b0c4c') =>
	`<audio src="/files/file?file=${id}&amp;name=strassenkritik_literarische_tagebuecher_drk_20220729_1051_ef315d33.mp3" controls="true" controlslist="nodownload"> </audio>`;
const getVideoHtml = (id = '62e3a8f926cefc001d5b12ae') =>
	`<video src="/files/file?file=${id}&amp;name=blinkencount.mp4" controls="true" controlslist="nodownload"> </video>`;

describe('file copy append service', () => {
	let module: TestingModule;
	let copyService: FileCopyAppendService;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let fileServiceAdapter: DeepMocked<FilesStorageClientAdapterService>;
	let fileLegacyService: DeepMocked<FileLegacyService>;

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
				FileCopyAppendService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: FileLegacyService,
					useValue: createMock<FileLegacyService>(),
				},
			],
		}).compile();

		copyService = module.get(FileCopyAppendService);
		copyHelperService = module.get(CopyHelperService);
		fileServiceAdapter = module.get(FilesStorageClientAdapterService);
		fileLegacyService = module.get(FileLegacyService);
	});

	describe('copying files attached to tasks', () => {
		describe('when no files are present', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({ school });
				const taskCopy = taskFactory.buildWithId({ school });
				const copyStatus: CopyStatus = {
					type: CopyElementType.LESSON,
					title: 'Tolle Lesson',
					status: CopyStatusEnum.SUCCESS,
					elements: [
						{
							type: CopyElementType.TASK,
							title: 'Toller Task',
							status: CopyStatusEnum.SUCCESS,
							originalEntity: originalTask,
							copyEntity: taskCopy,
						},
					],
				};
				const jwt = 'super';
				return { copyStatus, jwt };
			};

			it('should not change status', async () => {
				const { copyStatus, jwt } = setup();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				expect(updatedCopyStatus).toEqual(copyStatus);
			});
		});

		describe('when taskstatus is failed before appending files', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({ school });
				const taskCopy = taskFactory.buildWithId({ school });
				const copyStatus: CopyStatus = {
					type: CopyElementType.LESSON,
					title: 'Tolle Lesson',
					status: CopyStatusEnum.FAIL,
					elements: [
						{
							type: CopyElementType.TASK,
							title: taskCopy.name,
							status: CopyStatusEnum.FAIL,
							originalEntity: originalTask,
						},
					],
				};
				const copyStatusMockResult = CopyStatusEnum.NOT_IMPLEMENTED;
				copyHelperService.deriveStatusFromElements.mockReturnValue(copyStatusMockResult);
				const jwt = 'veryveryverylongstringthatissignedandstuff';
				return { copyStatus, originalTask, taskCopy, jwt, copyStatusMockResult };
			};

			it('it should not try to copy on failed taskstatus', async () => {
				const { copyStatus, jwt } = setup();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				expect(updatedCopyStatus).toEqual(copyStatus);
			});
		});

		describe('when status contains task with files', () => {
			const setup = () => {
				const school = schoolFactory.buildWithId();
				const originalTask = taskFactory.buildWithId({ school });
				const taskCopy = taskFactory.buildWithId({ school });
				const FILENAME1 = 'Tolle Datei';
				const FILENAME2 = 'Tolle Datei 1';
				const copyStatus: CopyStatus = {
					type: CopyElementType.LESSON,
					title: 'Tolle Lesson',
					status: CopyStatusEnum.SUCCESS,
					elements: [
						{
							type: CopyElementType.TASK,
							title: taskCopy.name,
							status: CopyStatusEnum.PARTIAL,
							copyEntity: taskCopy,
							originalEntity: originalTask,
							elements: [
								{
									type: CopyElementType.FILE_GROUP,
									title: 'Tolle Filegroup',
									status: CopyStatusEnum.PARTIAL,
									elements: [
										{
											type: CopyElementType.FILE,
											title: FILENAME1,
											status: CopyStatusEnum.NOT_IMPLEMENTED,
										},
										{
											type: CopyElementType.FILE,
											title: FILENAME2,
											status: CopyStatusEnum.NOT_IMPLEMENTED,
										},
									],
								},
							],
						},
					],
				};
				const fileDtos = [
					new FileDto({
						id: 'some-file-id',
						name: FILENAME1,
						parentType: FileRecordParamsParentTypeEnum.Tasks,
						parentId: 'some-task-id',
						schoolId: school.id,
					}),
					new FileDto({
						id: 'some-file-id2',
						name: FILENAME2,
						parentType: FileRecordParamsParentTypeEnum.Tasks,
						parentId: 'some-task-id',
						schoolId: school.id,
					}),
				];
				fileServiceAdapter.copyFilesOfParent.mockResolvedValue(fileDtos);
				const copyStatusMockResult = CopyStatusEnum.NOT_IMPLEMENTED;
				copyHelperService.deriveStatusFromElements.mockReturnValue(copyStatusMockResult);
				const jwt = 'veryveryverylongstringthatissignedandstuff';
				return { copyStatus, originalTask, taskCopy, jwt, copyStatusMockResult };
			};

			it('should copy files of task via fileServiceAdapter', async () => {
				const { copyStatus, originalTask, taskCopy, jwt } = setup();
				await copyService.appendFiles(copyStatus, jwt);
				const param = {
					jwt,
					schoolId: originalTask.school.id,
					parentType: FileRecordParamsParentTypeEnum.Tasks,
					parentId: originalTask.id,
				};
				const target = {
					jwt,
					schoolId: taskCopy.school.id,
					parentType: FileRecordParamsParentTypeEnum.Tasks,
					parentId: taskCopy.id,
				};
				expect(fileServiceAdapter.copyFilesOfParent).toHaveBeenCalledWith(param, target);
			});

			it('should update status of lesson', async () => {
				const { copyStatus, jwt, copyStatusMockResult } = setup();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				expect(updatedCopyStatus.status).toEqual(copyStatusMockResult);
			});

			it('should update status of task', async () => {
				const { copyStatus, jwt, copyStatusMockResult } = setup();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
				expect(taskStatus?.status).toEqual(copyStatusMockResult);
			});

			it('should update status of filegroup', async () => {
				const { copyStatus, jwt } = setup();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
				const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(fileGroupStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
			});

			it('should replace status of copied files', async () => {
				const { copyStatus, jwt } = setup();
				const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
				const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
				const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
				expect(
					fileGroupStatus?.elements?.every(
						(el) => el.type === CopyElementType.FILE && el.status === CopyStatusEnum.SUCCESS
					)
				).toBeTruthy();
			});

			describe('failing file copy', () => {
				const setup2 = () => {
					const school = schoolFactory.buildWithId();
					const originalTask = taskFactory.buildWithId({ school });
					const taskCopy = taskFactory.buildWithId({ school });
					const FILENAME1 = 'Tolle Datei';
					const FILENAME2 = 'Tolle Datei 1';
					const copyStatus: CopyStatus = {
						type: CopyElementType.LESSON,
						title: 'Tolle Lesson',
						status: CopyStatusEnum.SUCCESS,
						elements: [
							{
								type: CopyElementType.TASK,
								title: taskCopy.name,
								status: CopyStatusEnum.PARTIAL,
								copyEntity: taskCopy,
								originalEntity: originalTask,
								elements: [
									{
										type: CopyElementType.FILE_GROUP,
										title: 'Tolle Filegroup',
										status: CopyStatusEnum.PARTIAL,
										elements: [
											{
												type: CopyElementType.FILE,
												title: FILENAME1,
												status: CopyStatusEnum.NOT_IMPLEMENTED,
											},
											{
												type: CopyElementType.FILE,
												title: FILENAME2,
												status: CopyStatusEnum.NOT_IMPLEMENTED,
											},
										],
									},
								],
							},
						],
					};
					fileServiceAdapter.copyFilesOfParent.mockRejectedValue(new Error());
					const copyStatusMockResult = CopyStatusEnum.PARTIAL;
					copyHelperService.deriveStatusFromElements.mockReturnValue(copyStatusMockResult);
					const jwt = 'veryveryverylongstringthatissignedandstuff';
					return { copyStatus, originalTask, taskCopy, jwt, copyStatusMockResult };
				};

				it('should return partially failed CopyStatus, if file copy failed', async () => {
					const { copyStatus, jwt, copyStatusMockResult } = setup2();
					const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
					const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
					const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
					expect(taskStatus?.status).toEqual(copyStatusMockResult);
					expect(fileGroupStatus?.status).toEqual(CopyStatusEnum.FAIL);
				});

				it('should set copy status of files', async () => {
					const { copyStatus, jwt } = setup2();
					const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
					const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
					const fileGroupStatus = taskStatus?.elements?.find((el) => el.type === CopyElementType.FILE_GROUP);
					expect(
						fileGroupStatus?.elements?.every(
							(el) => el.type === CopyElementType.FILE && el.status === CopyStatusEnum.FAIL
						)
					).toBeTruthy();
				});

				it('should update status of lesson', async () => {
					const { copyStatus, jwt, copyStatusMockResult } = setup2();
					const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
					expect(updatedCopyStatus.status).toEqual(copyStatusMockResult);
				});

				it('should update status of task', async () => {
					const { copyStatus, jwt, copyStatusMockResult } = setup2();
					const updatedCopyStatus = await copyService.appendFiles(copyStatus, jwt);
					const taskStatus = updatedCopyStatus.elements?.find((el) => el.type === CopyElementType.TASK);
					expect(taskStatus?.status).toEqual(copyStatusMockResult);
				});
			});
		});
	});

	describe('copying of embedded files', () => {
		describe('copying files in lessons', () => {
			describe('when no files are present', () => {
				const setup = () => {
					const user = userFactory.build();
					const originalCourse = courseFactory.build({ school: user.school });
					const originalLesson = lessonFactory.build({ course: originalCourse });
					const copyLesson = lessonFactory.build({ course: originalCourse });
					const copyStatus: CopyStatus = {
						type: CopyElementType.LESSON,
						title: 'Tolle Lesson',
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalLesson,
						copyEntity: copyLesson,
					};
					const jwt = 'veryveryverylongstringthatissignedandstuff';
					return { originalCourse, user, copyStatus, jwt };
				};
				it('should not change status', async () => {
					const { originalCourse, copyStatus, user, jwt } = setup();

					const updatedCopyStatus = await copyService.copyFiles(copyStatus, originalCourse.id, user.id, jwt);
					expect(updatedCopyStatus).toEqual(copyStatus);
				});
			});

			describe('when files are present', () => {
				const setup = (oldFileId: string, text: string) => {
					const user = userFactory.build();
					const originalCourse = courseFactory.build({ school: user.school });
					const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
					const textContent: IComponentProperties = {
						title: '',
						hidden: false,
						component: ComponentType.TEXT,
						content: { text },
					};
					const originalLesson = lessonFactory.build({ course: originalCourse, contents: [textContent] });
					const copyLesson = lessonFactory.build({ course: originalCourse, contents: [textContent] });
					const mockedCopyFileResult = {
						oldFileId,
						fileId: 'fnew123',
						filename: 'file.jpg',
					};
					fileLegacyService.copyFile.mockResolvedValue(mockedCopyFileResult);
					const copyStatus: CopyStatus = {
						type: CopyElementType.LESSON,
						title: 'Tolle Lesson',
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalLesson,
						copyEntity: copyLesson,
					};
					const jwt = 'veryveryverylongstringthatissignedandstuff';

					return {
						user,
						copyStatus,
						originalCourse,
						destinationCourse,
						originalLesson,
						mockedCopyFileResult,
						jwt,
					};
				};

				it('should use fileLegacyService.copyFile', async () => {
					const oldFileId = 'fold123';
					const { originalCourse, copyStatus, user, jwt } = setup(oldFileId, getImageHtml(oldFileId));

					await copyService.copyFiles(copyStatus, originalCourse.id, user.id, jwt);
					expect(fileLegacyService.copyFile).toHaveBeenCalledWith({
						fileId: oldFileId,
						targetCourseId: originalCourse.id,
						userId: user.id,
					});
				});

				// it('should copy embedded files ', () => {
				// 	// copyFiles(copyStatus: CopyStatus, course: Course, userId: EntityId, jwt: string)
				// 	const text = 'here should be a text with a embedded file';
				// 	const { user, copyStatus, originalCourse, jwt } = setup(text);
				// });
				it('should embed files in copy', () => {});
				it('should set copyStatus ?', () => {});
				// do we need to add copyEmbeddedFilesOfLessons have been called?
			});
		});

		describe.skip('copying files in tasks', () => {
			const setup = (description: string) => {
				const user = userFactory.build(); // oder reicht school factory?
				const originalCourse = courseFactory.build({ school: user.school });
				const originalTask = taskFactory.buildWithId({
					school: user.school,
					description,
				});
			};
		});

		describe('extractFileIds of old fileservice', () => {
			it('should return empty array when no file-urls were found', () => {
				const text = '<p><img src="http://example.com/random/file/12345.jpg"></p>';
				const fileIds = copyService.extractOldFileIds(text);
				expect(fileIds).toBeDefined();
				expect(fileIds.length).toEqual(0);
			});

			it('should extract old image fileIds', () => {
				const fileId = '62e28f7631c717523e6b696e';
				const text = getImageHtml(fileId);
				const extractedFileIds = copyService.extractOldFileIds(text);
				expect(extractedFileIds[0]).toEqual(fileId);
			});

			it('should extract old audio fileIds', () => {
				const fileId = '72e28f7631c717523e6b696d';
				const text = getAudioHtml(fileId);
				const extractedFileIds = copyService.extractOldFileIds(text);
				expect(extractedFileIds[0]).toEqual(fileId);
			});

			it('should extract old video fileIds', () => {
				const fileId = '82e28f7631c717523e6b696c';
				const text = getVideoHtml(fileId);
				const extractedFileIds = copyService.extractOldFileIds(text);
				expect(extractedFileIds[0]).toEqual(fileId);
			});

			it('should extract mutliple old fileIds', () => {
				const fileId1 = '92e28f7631c717523e6b696b';
				const fileId2 = 'a2e28f7631c717523e6b696a';
				const fileId3 = 'b2e28f7631c717523e6b6969';
				const text = `<p>Video1:</p>${getVideoHtml(fileId1)}
					<p>Video2:</p>${getVideoHtml(fileId2)}
					<p>Image:</p>${getVideoHtml(fileId3)}`;
				const extractedFileIds = copyService.extractOldFileIds(text);
				expect(extractedFileIds.join('|')).toEqual(`${fileId1}|${fileId2}|${fileId3}`);
			});
		});
	});
});

// ggf. factories für CopyStatus instanzen...
