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
			const originalFile = fileFactory.buildWithId({ name: 'file.jpg' });
			const html = getImageHTML(originalFile.id, originalFile.name);
			const jwt = 'asdaksjdaskjdhsdjkfhsd';
			return { originalFile, school, jwt, html };
		};

		const lessonSetup = () => {
			const { originalFile, school, jwt, html } = setup();
			const originalCourse = courseFactory.build({ school });
			const textContent: IComponentProperties = {
				title: '',
				hidden: false,
				component: ComponentType.TEXT,
				content: { text: html },
			};
			const originalLesson = lessonFactory.build({ course: originalCourse, contents: [textContent] });
			const copyLesson = lessonFactory.build({ course: originalCourse, contents: [textContent] });
			return { originalLesson, copyLesson, originalFile, schoolId: school.id, jwt };
		};

		it('it should return copy response', async () => {
			const { originalLesson, copyLesson, schoolId, jwt } = lessonSetup();

			const mockedResponse = [{ id: 'mockedFileId', sourceId: 'mockedSourceId', name: 'mockedName' }];

			filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue(mockedResponse);
			const copyResponse = await copyFilesService.copyFilesOfEntity(originalLesson, copyLesson, schoolId, jwt);

			expect(copyResponse.response).toEqual(mockedResponse);
		});

		it('it handle error in copyFilesOfParent ', async () => {
			const { originalLesson, copyLesson, schoolId, jwt } = lessonSetup();

			filesStorageClientAdapterService.copyFilesOfParent.mockRejectedValue(new Error(''));
			const copyResponse = await copyFilesService.copyFilesOfEntity(originalLesson, copyLesson, schoolId, jwt);

			expect(copyResponse.entity).toEqual(copyLesson);
			expect(copyResponse.response).toEqual([]);
		});

		it('it should replace copied urls in lesson', async () => {
			const { originalLesson, copyLesson, originalFile, schoolId, jwt } = lessonSetup();

			const mockedResponse = [{ id: 'mockedFileId', sourceId: originalFile.id, name: 'mockedName' }];

			filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue(mockedResponse);
			const copyResponse = await copyFilesService.copyFilesOfEntity(originalLesson, copyLesson, schoolId, jwt);

			const lesson = copyResponse.entity as Lesson;
			const { text } = lesson.contents[0].content as IComponentTextProperties;

			const expectedHTML = getImageHTML(mockedResponse[0].id, mockedResponse[0].name);
			expect(text).toEqual(expectedHTML);
		});

		it('it should replace copied urls in task', async () => {
			const { originalFile, jwt, html, school } = setup();

			const originalTask = taskFactory.buildWithId({ school, description: html });
			const copyTask = taskFactory.buildWithId({ school, description: html });

			const mockedResponse = [{ id: 'mockedFileId', sourceId: originalFile.id, name: 'mockedName' }];

			filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue(mockedResponse);
			const copyResponse = await copyFilesService.copyFilesOfEntity(originalTask, copyTask, school.id, jwt);

			const { description } = copyResponse.entity as Task;

			const expectedHTML = getImageHTML(mockedResponse[0].id, mockedResponse[0].name);
			expect(description).toEqual(expectedHTML);
		});
	});
});
