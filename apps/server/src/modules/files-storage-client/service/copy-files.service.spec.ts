import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { CopyElementType, CopyHelperService } from '@modules/copy-helper';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import { ComponentProperties, ComponentType, LessonEntity, Material } from '@modules/lesson/repo';
import { lessonFactory } from '@modules/lesson/testing';
import { schoolEntityFactory } from '@modules/school/testing';
import { Submission, Task } from '@modules/task/repo';
import { User } from '@modules/user/repo';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { CopyFilesService } from './copy-files.service';
import { FilesStorageClientAdapterService } from './files-storage-client.service';

const getImageHTML = (id: string, name: string) => {
	const fileUrl = `"/api/v3/file/download/${id}/${name}"`;

	return `<figure class="image"><img src=${fileUrl} alt /></figure>`;
};

describe('copy files service', () => {
	let module: TestingModule;
	let copyFilesService: CopyFilesService;
	let copyHelperService: DeepMocked<CopyHelperService>;
	let filesStorageClientAdapterService: DeepMocked<FilesStorageClientAdapterService>;

	beforeAll(async () => {
		await setupEntities([User, Task, Submission, LessonEntity, Material, CourseEntity, CourseGroupEntity]);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CopyFilesService,
				{
					provide: CopyHelperService,
					useValue: createMock<CopyHelperService>(),
				},
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		copyFilesService = module.get(CopyFilesService);
		copyHelperService = module.get(CopyHelperService);
		filesStorageClientAdapterService = module.get(FilesStorageClientAdapterService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('copy files of entity', () => {
		const setup = () => {
			const school = schoolEntityFactory.build();
			const fileId1 = new ObjectId().toHexString();
			const fileId2 = new ObjectId().toHexString();
			const fileName1 = 'file-1.jpg';
			const fileName2 = 'file-2.jpg';
			const imageHTML1 = getImageHTML(fileId1, fileName1);
			const imageHTML2 = getImageHTML(fileId2, fileName2);

			return { school, imageHTML1, imageHTML2 };
		};

		describe('copy files of lesson', () => {
			const lessonSetup = () => {
				const { school, imageHTML1, imageHTML2 } = setup();
				const originalCourse = courseEntityFactory.build({ school });
				const textContent: ComponentProperties = {
					title: '',
					hidden: false,
					component: ComponentType.TEXT,
					content: { text: `${imageHTML1} test abschnitt ${imageHTML2}` },
				};
				const geoGebraContent: ComponentProperties = {
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
				const userId = '123';
				const mockedFileDto = { id: 'mockedFileId', sourceId: 'mockedSourceId', name: 'mockedName' };

				filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue([mockedFileDto]);
				return { originalLesson, copyLesson, schoolId: school.id, userId, mockedFileDto };
			};

			it('should return fileUrlReplacements', async () => {
				const { originalLesson, copyLesson, userId, mockedFileDto } = lessonSetup();

				const copyResponse = await copyFilesService.copyFilesOfEntity(originalLesson, copyLesson, userId);

				expect(copyResponse.fileUrlReplacements.length).toEqual(1);
				expect(copyResponse.fileUrlReplacements[0].regex).toBeInstanceOf(RegExp);
				expect(copyResponse.fileUrlReplacements[0].replacement).toContain(mockedFileDto.id);
				expect(copyResponse.fileUrlReplacements[0].replacement).toContain(mockedFileDto.name);
			});

			it('should return a copyStatus', async () => {
				const { originalLesson, copyLesson, userId } = lessonSetup();

				const copyResponse = await copyFilesService.copyFilesOfEntity(originalLesson, copyLesson, userId);

				expect(copyHelperService.deriveStatusFromElements).toHaveBeenCalled();
				expect(copyResponse.fileCopyStatus).toBeDefined();
				expect(copyResponse.fileCopyStatus.type).toBe(CopyElementType.FILE_GROUP);
			});
		});
	});
});
