import { faker } from '@faker-js/faker';
import { type DeepMocked, createMock } from '@golevelup/ts-jest';
import { ConfigurationModule } from '@infra/configuration';
import { fileRecordResponseFactory } from '@infra/files-storage-rest-client/testing';
import { LegacyLogger } from '@infra/logger';
import { HttpStatus, StreamableFile } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { type Request, type Response } from 'express';
import { Readable } from 'stream';
import { COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig } from '../common-cartridge.config';
import { CommonCartridgeVersion } from '../export/common-cartridge.enums';
import { type CommonCartridgeExportResponse } from '../service/common-cartridge-export.response';
import { CommonCartridgeUc } from '../uc/common-cartridge.uc';
import { CommonCartridgeController } from './common-cartridge.controller';
import { type ExportCourseParams } from './dto';
import { type CommonCartridgeFileParams } from './dto/common-cartridge-file.params';
import { type CourseExportBodyParams } from './dto/course-export.body.params';
import { type CourseQueryParams } from './dto/course.query.params';

describe('CommonCartridgeController', () => {
	let module: TestingModule;
	let sut: CommonCartridgeController;
	let commonCartridgeUcMock: DeepMocked<CommonCartridgeUc>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [ConfigurationModule.register(COMMON_CARTRIDGE_PUBLIC_API_CONFIG_TOKEN, CommonCartridgePublicApiConfig)],
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
		describe('when exporting a course', () => {
			const setup = () => {
				const courseId = faker.string.uuid();
				const params: ExportCourseParams = { courseId };
				const query: CourseQueryParams = { version: CommonCartridgeVersion.V_1_1_0 };
				const body: CourseExportBodyParams = {
					topics: [faker.string.uuid(), faker.string.uuid()],
					tasks: [faker.string.uuid()],
					columnBoards: [faker.string.uuid(), faker.string.uuid()],
				};
				const expected: CommonCartridgeExportResponse = {
					data: Readable.from(faker.lorem.paragraphs(100)),
					name: faker.string.alpha(),
				};
				const mockRequest = createMock<Request>();
				mockRequest.headers.cookie = `jwt=${faker.internet.jwt()}`;

				const mockResponse = createMock<Response>();

				commonCartridgeUcMock.exportCourse.mockResolvedValue(expected);

				return { params, expected, query, body, mockRequest, mockResponse };
			};

			it('should check that export is enabled', async () => {
				const { params, query, body, mockRequest, mockResponse } = setup();

				await sut.exportCourse(params, query, body, mockRequest, mockResponse);

				expect(commonCartridgeUcMock.checkExportEnabled).toHaveBeenCalled();
			});

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
	});

	describe('uploadFileAndStartImport', () => {
		describe('when importing a course', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const fileRecordResponse = fileRecordResponseFactory.build();
				const body: CommonCartridgeFileParams = { file: '' };

				commonCartridgeUcMock.uploadFileFromRequestToTemp.mockResolvedValueOnce(fileRecordResponse);

				return { currentUser, fileRecordResponse, body };
			};

			it('should check that import is enabled', async () => {
				const { currentUser, body } = setup();

				await sut.uploadFileAndStartImport(currentUser, body);

				expect(commonCartridgeUcMock.checkImportEnabled).toHaveBeenCalled();
			});

			it('should call the uc to upload file and start the import', async () => {
				const { currentUser, fileRecordResponse, body } = setup();

				await sut.uploadFileAndStartImport(currentUser, body);

				expect(commonCartridgeUcMock.uploadFileFromRequestToTemp).toHaveBeenCalledWith(currentUser);
				expect(commonCartridgeUcMock.startCourseImport).toHaveBeenCalledWith({
					fileRecordId: fileRecordResponse.id,
					fileUrl: fileRecordResponse.url,
					fileName: fileRecordResponse.name,
				});
			});
		});
	});
});
