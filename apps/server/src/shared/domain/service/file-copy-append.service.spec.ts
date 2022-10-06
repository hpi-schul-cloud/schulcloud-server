import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, IComponentProperties } from '@shared/domain';
import { courseFactory, fileFactory, lessonFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { CopyFilesService, FilesStorageClientAdapterService } from '@src/modules';
import { CopyFileDto } from '@src/modules/files-storage-client/dto';
import { IComponentTextProperties, Task } from '../entity';
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

const getEmbeddedHtml = (file: { id: string; name: string }) => {
	const matches = file.name.match(/\.([^.]+)$/);
	const ext = matches ? matches[1] : undefined;
	switch (ext) {
		case '.mp3':
			return `<audio src="/files/file?file=${file.id}&amp;name=${file.name}" controls="true" controlslist="nodownload"> </audio>`;
		case '.mp4':
			return `<video src="/files/file?file=${file.id}&amp;name=${file.name}" controls="true" controlslist="nodownload"> </video>`;
		case '.jpg':
		default:
			return `<figure class="image"><img src="/files/file?file=${file.id}&amp;name=${file.name}" alt /></figure>`;
	}
};
const getSubStatus = (status: CopyStatus | undefined, type: CopyElementType) =>
	(status?.elements || []).find((el) => el.type === type);

describe('file copy append service', () => {
	let module: TestingModule;
	let copyService: FileCopyAppendService;
	let fileServiceAdapter: DeepMocked<FilesStorageClientAdapterService>;
	let fileLegacyService: DeepMocked<FileLegacyService>;
	let copyFilesService: DeepMocked<CopyFilesService>;

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
				CopyHelperService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: FileLegacyService,
					useValue: createMock<FileLegacyService>(),
				},
				{
					provide: CopyFilesService,
					useValue: createMock<CopyFilesService>(),
				},
			],
		}).compile();

		copyService = module.get(FileCopyAppendService);
		fileServiceAdapter = module.get(FilesStorageClientAdapterService);
		fileLegacyService = module.get(FileLegacyService);
		copyFilesService = module.get(CopyFilesService);
	});

	describe('copying of embedded files', () => {
		describe('copying files in lessons', () => {
			describe('when no files are present', () => {
				const setup = () => {
					const user = userFactory.build();
					const originalCourse = courseFactory.build({ school: user.school });
					const textWithoutFile = 'I am a lesson without a file';
					const textContent: IComponentProperties = {
						title: 'LessonTitle',
						hidden: false,
						component: ComponentType.TEXT,
						content: { text: textWithoutFile },
					};
					const originalLesson = lessonFactory.build({ course: originalCourse, contents: [textContent] });
					const copyLesson = lessonFactory.build({ course: originalCourse, contents: [textContent] });
					const copyStatus: CopyStatus = {
						type: CopyElementType.LESSON,
						title: 'Tolle Lesson',
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalLesson,
						copyEntity: copyLesson,
					};

					return { originalCourse, user, copyStatus, copyLesson };
				};

				it('should not change status', async () => {
					const { originalCourse, copyStatus, user } = setup();

					const updatedCopyStatus = await copyService.copyFiles(copyStatus, originalCourse.id, user.id);
					expect(updatedCopyStatus).toEqual(copyStatus);
				});

				it('should not change status if original entity is task', async () => {
					const { originalCourse, user, copyLesson } = setup();
					const originalTask = taskFactory.build();
					const copyStatus: CopyStatus = {
						type: CopyElementType.LESSON,
						title: 'Tolle Lesson',
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalTask,
						copyEntity: copyLesson,
					};

					const updatedCopyStatus = await copyService.copyEmbeddedLegacyFilesOfLessons(
						copyStatus,
						originalCourse.id,
						user.id
					);
					expect(updatedCopyStatus).toEqual(copyStatus);
				});
			});

			describe('when files are present', () => {
				const setup = (contents: IComponentProperties[]) => {
					const user = userFactory.build();
					const originalCourse = courseFactory.build({ school: user.school });
					const destinationCourse = courseFactory.build({ school: user.school, teachers: [user] });
					const originalLesson = lessonFactory.build({
						course: originalCourse,
						contents,
					});
					const copyLesson = lessonFactory.build({ course: originalCourse, contents });
					const copyStatus: CopyStatus = {
						type: CopyElementType.LESSON,
						title: 'Tolle Lesson',
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalLesson,
						copyEntity: copyLesson,
					};

					return {
						user,
						copyStatus,
						originalCourse,
						destinationCourse,
						originalLesson,
						copyLesson,
						userId: user.id,
					};
				};

				it('should replace legacy file ids', async () => {
					const originalFile = fileFactory.buildWithId({ name: 'file.jpg' });
					const text = getEmbeddedHtml(originalFile);
					const textContent: IComponentProperties = {
						title: '',
						hidden: false,
						component: ComponentType.TEXT,
						content: { text },
					};
					const geoGebraContent: IComponentProperties = {
						title: 'geoGebra component 1',
						hidden: false,
						component: ComponentType.GEOGEBRA,
						content: {
							materialId: 'foo',
						},
					};

					const { originalCourse, copyStatus, user, copyLesson, originalLesson, userId } = setup([
						textContent,
						geoGebraContent,
					]);

					fileLegacyService.copyFile.mockResolvedValue({
						oldFileId: originalFile.id,
						fileId: 'fnew123',
						filename: 'file.jpg',
					});

					copyFilesService.copyFilesOfEntity.mockResolvedValue({ entity: copyLesson, response: [] });

					await copyService.copyFiles(copyStatus, originalCourse.id, user.id);

					const updatedCopyLesson = { ...copyLesson };
					const content = updatedCopyLesson.contents[1].content as unknown as IComponentTextProperties;
					content.text = '<figure class="image"><img src="/files/file?file=fnew123&amp;name=file.jpg" alt /></figure>';

					expect(copyFilesService.copyFilesOfEntity).toHaveBeenCalledWith(originalLesson, updatedCopyLesson, userId);
				});

				it('should leave embedded file urls untouched, if files were not copied', async () => {
					const originalFile = fileFactory.buildWithId({ name: 'file.jpg' });
					const textContent: IComponentProperties = {
						title: '',
						hidden: false,
						component: ComponentType.TEXT,
						content: { text: '' },
					};

					const { originalCourse, copyStatus, user, copyLesson, originalLesson, userId } = setup([textContent]);

					fileLegacyService.copyFile.mockResolvedValue({ oldFileId: originalFile.id });
					const status = await copyService.copyFiles(copyStatus, originalCourse.id, user.id);

					copyFilesService.copyFilesOfEntity.mockResolvedValue({ entity: copyLesson, response: [] });

					expect(copyFilesService.copyFilesOfEntity).toHaveBeenCalledWith(originalLesson, copyLesson, userId);
					expect(status).toEqual(copyStatus);
				});

				it('should update status for new file service', async () => {
					const originalFile = fileFactory.buildWithId({ name: 'file.jpg' });
					const textContent: IComponentProperties = {
						title: '',
						hidden: false,
						component: ComponentType.TEXT,
						content: { text: '' },
					};

					const { originalCourse, copyStatus, user, copyLesson } = setup([textContent]);
					const reponse1 = new CopyFileDto({ id: 'id123', sourceId: originalFile.id, name: originalFile.name });
					copyFilesService.copyFilesOfEntity.mockResolvedValue({ entity: copyLesson, response: [reponse1] });
					const status = await copyService.copyFiles(copyStatus, originalCourse.id, user.id);

					expect(status.status).toEqual('success');
				});
			});
		});

		describe('copying files in tasks', () => {
			describe('when files are present', () => {
				const setup = () => {
					const user = userFactory.build();
					const originalFile = fileFactory.buildWithId({ name: 'file.jpg' });

					const originalCourse = courseFactory.build({ school: user.school });
					const description = getEmbeddedHtml(originalFile);
					const originalTask = taskFactory.buildWithId({
						school: user.school,
						description,
					});
					const copiedTask = taskFactory.buildWithId({
						school: user.school,
						course: originalCourse,
						description,
					});
					const copyStatus: CopyStatus = {
						type: CopyElementType.TASK,
						title: 'Toller Task',
						status: CopyStatusEnum.SUCCESS,
						originalEntity: originalTask,
						copyEntity: copiedTask,
					};

					return { originalTask, originalCourse, copyStatus, user, originalFile, userId: user.id };
				};

				it('should use file legacy service', async () => {
					const { originalCourse, copyStatus, user, originalFile } = setup();

					await copyService.copyFiles(copyStatus, originalCourse.id, user.id);
					expect(fileLegacyService.copyFile).toHaveBeenCalledWith({
						fileId: originalFile.id,
						targetCourseId: originalCourse.id,
						userId: user.id,
					});
				});

				it('should copy embedded files and update the url with the new id', async () => {
					const { originalCourse, copyStatus, user, originalFile, userId } = setup();
					const newFileId = 'new123';

					fileLegacyService.copyFile.mockResolvedValue({
						oldFileId: originalFile.id,
						fileId: newFileId,
						filename: originalFile.name,
					});

					copyFilesService.copyFilesOfEntity.mockResolvedValue({
						entity: copyStatus.copyEntity as Task,
						response: [
							{
								id: 'id',
								sourceId: 'sourceId',
								name: 'name',
							},
						],
					});

					const updatedStatus = await copyService.copyFiles(copyStatus, originalCourse.id, user.id);
					const fileGroupStatus = getSubStatus(updatedStatus, CopyElementType.FILE_GROUP);
					const file = getSubStatus(fileGroupStatus, CopyElementType.FILE);

					const updatedCopyTask = { ...updatedStatus.copyEntity } as Task;
					updatedCopyTask.description =
						'<figure class="image"><img src="/files/file?file=new123&amp;name=file.jpg" alt /></figure>';

					expect(copyFilesService.copyFilesOfEntity).toHaveBeenCalledWith(
						copyStatus.originalEntity,
						updatedCopyTask,
						userId
					);

					expect(updatedStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
					expect(fileGroupStatus?.status).toEqual(CopyStatusEnum.SUCCESS);
					expect(file?.status).toEqual(CopyStatusEnum.SUCCESS);
				});

				it('should try to copy embeddedFiles and not update on failure', async () => {
					const { originalCourse, copyStatus, user, originalFile, userId } = setup();

					fileLegacyService.copyFile.mockResolvedValue({
						oldFileId: originalFile.id,
					});

					copyFilesService.copyFilesOfEntity.mockResolvedValue({
						entity: copyStatus.copyEntity as Task,
						response: [],
					});

					const updatedStatus = await copyService.copyFiles(copyStatus, originalCourse.id, user.id);
					const fileGroupStatus = getSubStatus(updatedStatus, CopyElementType.FILE_GROUP);
					const file = getSubStatus(fileGroupStatus, CopyElementType.FILE);

					expect(copyFilesService.copyFilesOfEntity).toHaveBeenCalledWith(
						copyStatus.originalEntity,
						updatedStatus.copyEntity,
						userId
					);

					expect(updatedStatus?.status).toEqual(CopyStatusEnum.FAIL);
					expect(fileGroupStatus?.status).toEqual(CopyStatusEnum.FAIL);
					expect(file?.status).toEqual(CopyStatusEnum.FAIL);
					expect(file?.title).not.toEqual(originalFile.name);
				});

				it('should not change status if original entity is lesson', async () => {
					const { originalCourse, copyStatus, user } = setup();
					const originalLesson = lessonFactory.build();
					const status: CopyStatus = {
						...copyStatus,
						originalEntity: originalLesson,
					};

					const updatedCopyStatus = await copyService.copyEmbeddedLegacyFilesOfTasks(
						status,
						originalCourse.id,
						user.id
					);
					expect(updatedCopyStatus).toEqual(status);
				});
			});
		});

		describe('extractOldFileIds', () => {
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

		describe('replaceOldFileUrls', () => {
			it('should replace old file urls', () => {
				const oldFileId = 'old123';
				const fileId = 'new123';
				const filename = 'copied.jpg';
				const mockedCopyFileResult = {
					oldFileId,
					fileId,
					filename,
				};
				fileLegacyService.copyFile.mockResolvedValue(mockedCopyFileResult);
				const text = getImageHtml(oldFileId);
				const result = copyService.replaceOldFileUrls(text, oldFileId, fileId, filename);
				const expected = `<figure class="image"><img src="/files/file?file=${fileId}&amp;name=${filename}" alt /></figure>`;
				expect(result).toEqual(expected);
			});

			it('should replace multiple old file urls', () => {
				const oldFileId = 'old123';
				const fileId = 'new123';
				const filename = 'copied.jpg';
				fileLegacyService.copyFile.mockResolvedValueOnce({
					oldFileId,
					fileId,
					filename,
				});
				const text = getImageHtml('otherFile') + getImageHtml(oldFileId) + getImageHtml('otherFile2');
				const result = copyService.replaceOldFileUrls(text, oldFileId, fileId, filename);
				const expected = `<figure class="image"><img src="/files/file?file=otherFile&amp;name=david-marcu-78A265wPiO4-unsplash (1).jpg" alt /></figure><figure class="image"><img src="/files/file?file=${fileId}&amp;name=${filename}" alt /></figure><figure class="image"><img src="/files/file?file=otherFile2&amp;name=david-marcu-78A265wPiO4-unsplash (1).jpg" alt /></figure>`;
				expect(result).toEqual(expected);
			});
		});
	});
});

// ggf. factories für CopyStatus instanzen...
