import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, IComponentProperties, IComponentTextProperties, Lesson, Task } from '@shared/domain';
import { courseFactory, fileFactory, lessonFactory, setupEntities, schoolFactory, taskFactory } from '@shared/testing';
import { CopyFilesService } from './copy-files.service';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

const getImageHTML = (id: string, name: string) => {
	const fileUrl = `"/api/v3/file/download/${id}/${name}"`;
	return `<figure class="image"><img src=${fileUrl} alt /></figure>`;
};

describe('copy files service', () => {
	let module: TestingModule;
	let copyFilesService: CopyFilesService;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

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
				CopyFilesService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		copyFilesService = module.get(CopyFilesService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
	});

	describe('copy files of entity', () => {
		const setup = () => {
			const school = schoolFactory.build();
			const file1 = fileFactory.buildWithId({ name: 'file.jpg' });
			const file2 = fileFactory.buildWithId({ name: 'file.jpg' });
			const imageHTML1 = getImageHTML(file1.id, file1.name);
			const imageHTML2 = getImageHTML(file2.id, file2.name);
			const jwt = 'asdaksjdaskjdhsdjkfhsd';
			return { file1, file2, school, jwt, imageHTML1, imageHTML2 };
		};

		describe('copy files of lesson', () => {
			const lessonSetup = () => {
				const { file1, file2, school, jwt, imageHTML1, imageHTML2 } = setup();
				const originalCourse = courseFactory.build({ school });
				const textContent: IComponentProperties = {
					title: '',
					hidden: false,
					component: ComponentType.TEXT,
					content: { text: `${imageHTML1} test abschnitt ${imageHTML2}` },
				};
				const geoGebraContent: IComponentProperties = {
					title: 'geoGebra component 1',
					hidden: false,
					component: ComponentType.GEOGEBRA,
					content: {
						materialId: 'foo',
					},
				};
				const originalLesson = lessonFactory.build({
					course: originalCourse,
					contents: [geoGebraContent, textContent],
				});
				const copyLesson = lessonFactory.build({ course: originalCourse, contents: [geoGebraContent, textContent] });
				return { originalLesson, copyLesson, file1, file2, schoolId: school.id, jwt };
			};

			it('it should return copy response', async () => {
				const { originalLesson, copyLesson, jwt } = lessonSetup();

				const mockedResponse = [{ id: 'mockedFileId', sourceId: 'mockedSourceId', name: 'mockedName' }];

				filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue(mockedResponse);
				const copyResponse = await copyFilesService.copyFilesOfEntity(originalLesson, copyLesson, jwt);

				expect(copyResponse.response).toEqual(mockedResponse);
			});

			it('it should replace copied urls in lesson', async () => {
				const { originalLesson, copyLesson, file1, file2, jwt } = lessonSetup();

				const mockedResponse = [
					{ id: 'mockedFileId1', sourceId: file1.id, name: 'mockedName1' },
					{ id: 'mockedFileId2', sourceId: file2.id, name: 'mockedName2' },
				];

				filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue(mockedResponse);
				const copyResponse = await copyFilesService.copyFilesOfEntity(originalLesson, copyLesson, jwt);

				const lesson = copyResponse.entity as Lesson;
				const { text } = lesson.contents[1].content as IComponentTextProperties;

				const expectedHTML1 = getImageHTML(mockedResponse[0].id, mockedResponse[0].name);
				const expectedHTML2 = getImageHTML(mockedResponse[1].id, mockedResponse[1].name);

				expect(text).toContain(expectedHTML1);
				expect(text).toContain(expectedHTML2);
			});
		});

		describe('copy files of task', () => {
			it('it should replace copied urls in task in same school', async () => {
				const { file1, file2, jwt, imageHTML1, imageHTML2, school } = setup();

				const originalCourse = courseFactory.build();
				const targetCourse = courseFactory.build();
				const originalTask = taskFactory.buildWithId({
					school,
					description: `${imageHTML1} ${imageHTML2}`,
					course: originalCourse,
				});
				const copyTask = taskFactory.buildWithId({
					school,
					description: `${imageHTML1} ${imageHTML2}`,
					course: targetCourse,
				});

				const mockedResponse = [
					{ id: 'mockedFileId1', sourceId: file1.id, name: 'mockedName1' },
					{ id: 'mockedFileId2', sourceId: file2.id, name: 'mockedName2' },
				];

				filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue(mockedResponse);
				const copyResponse = await copyFilesService.copyFilesOfEntity(originalTask, copyTask, jwt);

				const { description } = copyResponse.entity as Task;

				const expectedHTML1 = getImageHTML(mockedResponse[0].id, mockedResponse[0].name);
				const expectedHTML2 = getImageHTML(mockedResponse[0].id, mockedResponse[0].name);
				expect(description).toContain(expectedHTML1);
				expect(description).toContain(expectedHTML2);
			});

			it('it should replace copied urls in task between different schools', async () => {
				const { file1, file2, jwt, imageHTML1, imageHTML2, school } = setup();

				const copySchool = schoolFactory.build();
				const originalCourse = courseFactory.build({ school });
				const targetCourse = courseFactory.build({ school: copySchool });
				const originalTask = taskFactory.buildWithId({
					school,
					description: `${imageHTML1} ${imageHTML2}`,
					course: originalCourse,
				});
				const copyTask = taskFactory.buildWithId({
					school: copySchool,
					description: `${imageHTML1} ${imageHTML2}`,
					course: targetCourse,
				});

				const mockedResponse = [
					{ id: 'mockedFileId1', sourceId: file1.id, name: 'mockedName1' },
					{ id: 'mockedFileId2', sourceId: file2.id, name: 'mockedName2' },
				];

				filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue(mockedResponse);
				const copyResponse = await copyFilesService.copyFilesOfEntity(originalTask, copyTask, jwt);

				const { description } = copyResponse.entity as Task;

				const expectedHTML1 = getImageHTML(mockedResponse[0].id, mockedResponse[0].name);
				const expectedHTML2 = getImageHTML(mockedResponse[0].id, mockedResponse[0].name);
				expect(description).toContain(expectedHTML1);
				expect(description).toContain(expectedHTML2);
			});
		});
	});
});
