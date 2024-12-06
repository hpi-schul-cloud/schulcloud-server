import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseFileIdsResponse } from '../controller/dto';
import { CourseExportBodyResponse } from '../controller/dto/course-export-body.response';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CommonCartridgeImportService } from '../service/common-cartridge-import.service';
import { CommonCartridgeUc } from './common-cartridge.uc';

describe('CommonCartridgeUc', () => {
	let module: TestingModule;
	let sut: CommonCartridgeUc;
	let commonCartridgeExportServiceMock: DeepMocked<CommonCartridgeExportService>;
	let commonCartridgeImportServiceMock: DeepMocked<CommonCartridgeImportService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
				{
					provide: CommonCartridgeImportService,
					useValue: createMock<CommonCartridgeImportService>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeUc);
		commonCartridgeExportServiceMock = module.get(CommonCartridgeExportService);
		commonCartridgeImportServiceMock = module.get(CommonCartridgeImportService);
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(sut).toBeDefined();
	});

	describe('exportCourse', () => {
		const setup = () => {
			const courseId = faker.string.uuid();
			const expected = new CourseExportBodyResponse({
				courseFileIds: new CourseFileIdsResponse([]),
				courseCommonCartridgeMetadata: {
					id: courseId,
					title: faker.lorem.sentence(),
					copyRightOwners: [],
					creationDate: faker.date.recent().toDateString(),
				},
			});

			commonCartridgeExportServiceMock.findCourseFileRecords.mockResolvedValue([]);
			commonCartridgeExportServiceMock.findCourseCommonCartridgeMetadata.mockResolvedValue(
				expected.courseCommonCartridgeMetadata
			);

			return { courseId, expected };
		};

		it('should return a course export response with file IDs and metadata of a course', async () => {
			const { courseId, expected } = setup();

			const result = await sut.exportCourse(courseId);

			expect(result).toEqual(expected);
		});
	});

	describe('importCourse', () => {
		const setup = () => {
			const file = Buffer.from(faker.lorem.paragraphs());

			return { file };
		};

		it('should class the import service', async () => {
			const { file } = setup();

			await sut.importCourse(file);

			expect(commonCartridgeImportServiceMock.importFile).toHaveBeenCalledWith(file);
		});
	});
});
