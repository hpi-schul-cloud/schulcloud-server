import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { StreamableFile } from '@nestjs/common';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeController } from './common-cartridge.controller';
import { ExportCourseParams } from './dto';
import { CourseQueryParams } from './dto/course.query.params';
import { CourseExportBodyParams } from './dto/course-export.body.params';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';

describe('CommonCartridgeController', () => {
	let module: TestingModule;
	let sut: CommonCartridgeController;
	let commonCartridgeUcMock: DeepMocked<CommonCartridgeUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						() => {
							return { FEATURE_COMMON_CARTRIDGE_COURSE_IMPORT_MAX_FILE_SIZE: 10_000 };
						},
					],
				}),
			],
			controllers: [CommonCartridgeController],
			providers: [
				{
					provide: CommonCartridgeUc,
					useValue: createMock<CommonCartridgeUc>(),
				},
			],
		}).compile();

		sut = module.get(CommonCartridgeController);
		commonCartridgeUcMock = module.get(CommonCartridgeUc);
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
			const params = { courseId } as ExportCourseParams;
			const query = { version: CommonCartridgeVersion.V_1_1_0 } as CourseQueryParams;
			const body = {
				topics: [faker.string.uuid(), faker.string.uuid()],
				tasks: [faker.string.uuid()],
				columnBoards: [faker.string.uuid(), faker.string.uuid()],
			} as CourseExportBodyParams;
			const expected = Buffer.from(faker.lorem.paragraphs(100));
			const mockResponse = {
				set: jest.fn(),
			} as unknown as Response;

			commonCartridgeUcMock.exportCourse.mockResolvedValue(expected);

			return { params, expected, query, body, mockResponse };
		};

		it('should return a streamable file', async () => {
			const { params, query, body, mockResponse } = setup();

			const result = await sut.exportCourse(params, query, body, mockResponse);

			expect(mockResponse.set).toHaveBeenCalledWith({
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename=course_${params.courseId}.zip`,
			});
			expect(result).toBeInstanceOf(StreamableFile);
		});
	});
});
