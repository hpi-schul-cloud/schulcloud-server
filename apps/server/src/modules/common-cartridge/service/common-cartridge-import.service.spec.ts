import { faker } from '@faker-js/faker';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CoursesClientAdapter } from '@infra/courses-client';
import { FilesStorageClientAdapter } from '@infra/files-storage-client';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import type { CommonCartridgeFileParser } from '../import/common-cartridge-file-parser';
import { CommonCartridgeImportService } from './common-cartridge-import.service';

jest.mock('../import/common-cartridge-file-parser', () => {
	const fileParserMock = createMock<CommonCartridgeFileParser>();
	const rootId = faker.string.uuid();

	fileParserMock.getTitle.mockReturnValue(faker.lorem.words());
	fileParserMock.getOrganizations.mockReturnValue([
		{
			pathDepth: 0,
			title: faker.lorem.words(),
			path: faker.system.filePath(),
			identifier: rootId,
			isInlined: true,
			isResource: false,
			resourcePath: faker.system.filePath(),
			resourceType: faker.lorem.word(),
		},
		{
			pathDepth: 1,
			title: faker.lorem.words(),
			path: `${rootId}/${faker.system.filePath()}`,
			identifier: faker.string.uuid(),
			isInlined: true,
			isResource: false,
			resourcePath: faker.system.filePath(),
			resourceType: faker.lorem.word(),
		},
	]);

	return {
		CommonCartridgeFileParser: jest.fn(() => fileParserMock),
	};
});

describe(CommonCartridgeImportService.name, () => {
	let module: TestingModule;
	let sut: CommonCartridgeImportService;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;
	let filesStorageClientAdapterMock: DeepMocked<FilesStorageClientAdapter>;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeImportService,
				{
					provide: CoursesClientAdapter,
					useValue: createMock<CoursesClientAdapter>(),
				},
				{
					provide: FilesStorageClientAdapter,
					useValue: createMock<FilesStorageClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeImportService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
		filesStorageClientAdapterMock = module.get(FilesStorageClientAdapter);
	});

	afterEach(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('importManifestFile', () => {
		describe('when importing a file', () => {
			const setup = () => {
				const file = Buffer.from('');
				const currentUser = currentUserFactory.build();

				return { file, currentUser };
			};

			it('should create a course', async () => {
				const { currentUser } = setup();
				await sut.importManifestFile(Buffer.from(''), currentUser);

				expect(coursesClientAdapterMock.createCourse).toHaveBeenCalledWith({ title: expect.any(String) });
				expect(filesStorageClientAdapterMock.upload).toHaveBeenCalledTimes(2);
			});
		});
	});
});
