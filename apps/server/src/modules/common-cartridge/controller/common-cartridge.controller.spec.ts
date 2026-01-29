import { LegacyLogger } from '@core/logger';
import { faker } from '@faker-js/faker';
import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigurationModule } from '@infra/configuration';
import { HttpStatus, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig } from '../common-cartridge.config';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeController } from './common-cartridge.controller';
import { ExportCourseParams } from './dto';
import { CourseExportBodyParams } from './dto/course-export.body.params';
import { CourseQueryParams } from './dto/course.query.params';

describe('CommonCartridgeController', () => {
	let module: TestingModule;
	let sut: CommonCartridgeController;
	let commonCartridgeUcMock: DeepMocked<CommonCartridgeUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigurationModule.register(COMMON_CARTRIDGE_CONFIG_TOKEN, CommonCartridgeConfig)],
			controllers: [CommonCartridgeController],
			providers: [
				{
					provide: CommonCartridgeUc,
					useValue: createMock<CommonCartridgeUc>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
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
			const expected: CommonCartridgeExportResponse = {
				data: Readable.from(faker.lorem.paragraphs(100)),
				name: faker.string.alpha(),
			};
			const mockRequest = createMock<Request>();
			const mockResponse = createMock<Response>();

			commonCartridgeUcMock.exportCourse.mockResolvedValue(expected);

			return { params, expected, query, body, mockRequest, mockResponse };
		};

		it('should return a streamable file', async () => {
			const { params, expected, query, body, mockRequest, mockResponse } = setup();

			const result = await sut.exportCourse(params, query, body, mockRequest, mockResponse);

			expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
			expect(result).toBeInstanceOf(StreamableFile);
			expect(result.options.disposition).toBe(
				`attachment; filename="${expected.name}"; filename*=UTF-8''${expected.name}`
			);
		});
	});

	describe('importCourse', () => {
		describe('when importing a course', () => {
			const setup = () => {
				const user = currentUserFactory.build();
				const file: Express.Multer.File = new StreamableFile(
					Buffer.from(faker.lorem.paragraphs(100)),
					'file.zip'
				) as unknown as Express.Multer.File;

				return { user, file };
			};
			it('should call the uc with the correct parameters', async () => {
				const { user, file } = setup();

				await sut.importCourse(user, file);

				expect(commonCartridgeUcMock.importCourse).toHaveBeenCalledTimes(1);
			});
		});
	});
});
