import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeExportService } from './common-cartridge-export.service';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportService;
	let filesStorageServiceMock: DeepMocked<FilesStorageClientAdapterService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeExportService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeExportService);
		filesStorageServiceMock = module.get(FilesStorageClientAdapterService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('findCourseFileRecords', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const expected = [];

			filesStorageServiceMock.listFilesOfParent.mockResolvedValue([]);

			return { courseId, expected };
		};

		it('should return a list of FileRecords', async () => {
			const { courseId, expected } = setup();

			const result = await sut.findCourseFileRecords(courseId);

			expect(result).toEqual(expected);
		});
	});
});
