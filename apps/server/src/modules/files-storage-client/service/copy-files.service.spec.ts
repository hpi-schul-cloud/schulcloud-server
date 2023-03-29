import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ComponentType, IComponentProperties } from '@shared/domain';
import { courseFactory, fileFactory, lessonFactory, schoolFactory, setupEntities } from '@shared/testing';
import { CopyElementType, CopyHelperService } from '@src/modules/copy-helper';
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
		await setupEntities();
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
			const school = schoolFactory.build();
			const file1 = fileFactory.buildWithId({ name: 'file.jpg' });
			const file2 = fileFactory.buildWithId({ name: 'file.jpg' });
			const imageHTML1 = getImageHTML(file1.id, file1.name);
			const imageHTML2 = getImageHTML(file2.id, file2.name);
			return { file1, file2, school, imageHTML1, imageHTML2 };
		};

		describe('copy files of lesson', () => {
			const lessonSetup = () => {
				const { file1, file2, school, imageHTML1, imageHTML2 } = setup();
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
				const userId = '123';
				const mockedFileDto = { id: 'mockedFileId', sourceId: 'mockedSourceId', name: 'mockedName' };

				filesStorageClientAdapterService.copyFilesOfParent.mockResolvedValue([mockedFileDto]);
				return { originalLesson, copyLesson, file1, file2, schoolId: school.id, userId, mockedFileDto };
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
