import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { FilesStorageClientAdapterService } from '@modules/files-storage-client';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonCartridgeExportService } from './common-cartridge-export.service';
import { CoursesClientAdapter } from '../common-cartridge-client/course-client';

describe('CommonCartridgeExportService', () => {
	let module: TestingModule;
	let sut: CommonCartridgeExportService;
	let filesStorageServiceMock: DeepMocked<FilesStorageClientAdapterService>;
	let coursesClientAdapterMock: DeepMocked<CoursesClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeExportService,
				{
					provide: FilesStorageClientAdapterService,
					useValue: createMock<FilesStorageClientAdapterService>(),
				},
				{
					provide: CoursesClientAdapter,
					useValue: createMock<CoursesClientAdapter>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeExportService);
		filesStorageServiceMock = module.get(FilesStorageClientAdapterService);
		coursesClientAdapterMock = module.get(CoursesClientAdapter);
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

	describe('findCourseCcMetadata', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const expected = {
				id: courseId,
				title: faker.lorem.sentence(),
			};

			coursesClientAdapterMock.getCourseCommonCartridgeMetadata.mockResolvedValue(expected);

			return { courseId, expected };
		};

		it('should return a CourseCommonCartridgeMetadataDto', async () => {
			const { courseId, expected } = setup();

			const result = await sut.findCourseCommonCartridgeMetadata(courseId);

			expect(result).toEqual(expected);
		});
	});
});
