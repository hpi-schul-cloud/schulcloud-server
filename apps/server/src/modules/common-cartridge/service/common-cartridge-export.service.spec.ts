import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesStorageService } from '@src/modules/files-storage/service';
import { CommonCartridgeExportService } from './common-cartridge-export.service';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportService;
	let filesStorageServiceMock: DeepMocked<FilesStorageService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeExportService,
				{
					provide: FilesStorageService,
					useValue: createMock<FilesStorageService>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeExportService);
		filesStorageServiceMock = module.get(FilesStorageService);
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

			filesStorageServiceMock.getFileRecordsOfParent.mockResolvedValue([[], 0]);

			return { courseId, expected };
		};

		it('should return a list of FileRecords', async () => {
			const { courseId, expected } = setup();

			const result = await sut.findCourseFileRecords(courseId);

			expect(result).toEqual(expected);
		});
	});
});
