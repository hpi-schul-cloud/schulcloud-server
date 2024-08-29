import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseFileIdsResponse } from '../controller/dto';
import { CommonCartridgeExportService } from '../service/common-cartridge-export.service';
import { CommonCartridgeUc } from './common-cartridge.uc';
import { CourseExportBodyResponse } from '../controller/dto/course-export-body.response';

describe('CommonCartridgeUc', () => {
	let module: TestingModule;
	let sut: CommonCartridgeUc;
	let commonCartridgeExportServiceMock: DeepMocked<CommonCartridgeExportService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CommonCartridgeUc,
				{
					provide: CommonCartridgeExportService,
					useValue: createMock<CommonCartridgeExportService>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeUc);
		commonCartridgeExportServiceMock = module.get(CommonCartridgeExportService);
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
				},
			});

			commonCartridgeExportServiceMock.findCourseFileRecords.mockResolvedValue([]);
			commonCartridgeExportServiceMock.findCourseCommonCartridgeMetadata.mockResolvedValue({
				id: expected.courseCommonCartridgeMetadata?.id,
				title: expected.courseCommonCartridgeMetadata?.title,
			});

			return { courseId, expected };
		};

		it('should return a course export response with file IDs and metadata of a course', async () => {
			const { courseId, expected } = setup();

			const result = await sut.exportCourse(courseId);

			expect(result).toEqual(expected);
		});
	});
});
